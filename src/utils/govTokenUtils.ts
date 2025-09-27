/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { type MatrixClient } from "matrix-js-sdk/src/matrix";
import { DAOMnemonicWallet } from "./DAOMnemonicWallet";
import SpaceStore from "../stores/spaces/SpaceStore";

export interface GOVSettings {
    bTokenRequired: number;
}

/**
 * Get GOV settings from a space
 */
export const getGOVSettings = async (cli: MatrixClient, spaceId: string): Promise<GOVSettings | null> => {
    try {
        const room = cli.getRoom(spaceId);
        if (!room) return null;

        const stateEvent = room.currentState.getStateEvents("org.matrix.msc3381.space.gov_settings", "");
        if (!stateEvent) return null;

        const content = stateEvent.getContent();
        return content.settings || null;
    } catch (error) {
        console.error("Failed to get GOV settings:", error);
        return null;
    }
};

/**
 * Check if user has enough B tokens to create agenda
 */
export const checkBTokenBalance = async (cli: MatrixClient, userId: string, spaceId?: string): Promise<number> => {
    try {
        console.log(`🔍 [BALANCE CHECK] Starting balance check for user: ${userId}, spaceId: ${spaceId}`);
        
        // Get the GOV space room to find its parent DAO
        const govSpaceRoom = spaceId ? cli.getRoom(spaceId) : null;
        if (!govSpaceRoom) {
            console.log("❌ [BALANCE CHECK] No GOV space room found");
            return 0;
        }
        
        console.log(`✅ [BALANCE CHECK] GOV space found: ${govSpaceRoom.name} (${govSpaceRoom.roomId})`);
        
        // Find the parent DAO space (the space that contains this GOV space)
        const parentSpaces = SpaceStore.instance.getParents(govSpaceRoom.roomId);
        console.log(`🔍 [BALANCE CHECK] Parent spaces found: ${parentSpaces.length}`);
        
        let parentDAORoom = null;
        
        if (parentSpaces.length > 0) {
            // Method 1: Use SpaceStore parent relationship
            const parentDAOSpace = parentSpaces[0];
            parentDAORoom = cli.getRoom(parentDAOSpace.roomId);
            console.log(`✅ [BALANCE CHECK] Parent DAO found via SpaceStore: ${parentDAORoom?.name} (${parentDAOSpace.roomId})`);
        } else {
            // Method 2: Search for DAO space by looking for spaces with "DAO" in name
            console.log(`🔍 [BALANCE CHECK] No parent found via SpaceStore, searching for DAO spaces...`);
            const allSpaces = SpaceStore.instance.spacePanelSpaces;
            console.log(`🔍 [BALANCE CHECK] All spaces found: ${allSpaces.length}`);
            
            // Debug: List all spaces
            for (let i = 0; i < allSpaces.length; i++) {
                const space = allSpaces[i];
                const room = cli.getRoom(space.roomId);
                console.log(`🔍 [BALANCE CHECK] Space ${i}: name="${room?.name}", isSpace=${room?.isSpaceRoom()}, id=${space.roomId}`);
            }
            
            for (const space of allSpaces) {
                const room = cli.getRoom(space.roomId);
                console.log(`🔍 [BALANCE CHECK] Checking space: ${room?.name} (${space.roomId})`);
                
                if (room && room.isSpaceRoom() && room.name) {
                    console.log(`🔍 [BALANCE CHECK] Space details: name="${room.name}", isSpace=${room.isSpaceRoom()}`);
                    
                    // Check if this space has a GOV space as child (regardless of DAO in name)
                    const children = SpaceStore.instance.getChildren(room.roomId);
                    console.log(`🔍 [BALANCE CHECK] Space children count: ${children.length}`);
                    
                    for (const child of children) {
                        const childRoom = cli.getRoom(child.roomId);
                        console.log(`🔍 [BALANCE CHECK] Child: ${childRoom?.name} (${child.roomId})`);
                    }
                    
                    const hasGOVSpace = children.some(child => {
                        const childRoom = cli.getRoom(child.roomId);
                        const isGOV = childRoom && childRoom.name === "GOV" && childRoom.roomId === govSpaceRoom.roomId;
                        console.log(`🔍 [BALANCE CHECK] Child ${child.roomId} is GOV: ${isGOV}`);
                        return isGOV;
                    });
                    
                    console.log(`🔍 [BALANCE CHECK] Has GOV space as child: ${hasGOVSpace}`);
                    
                    if (hasGOVSpace) {
                        parentDAORoom = room;
                        console.log(`✅ [BALANCE CHECK] Found matching DAO: ${room.name} (${room.roomId})`);
                        break;
                    }
                }
            }
        }
        
        if (!parentDAORoom) {
            console.log("❌ [BALANCE CHECK] No parent DAO found for GOV space");
            return 0;
        }
        
        console.log(`✅ [BALANCE CHECK] Using DAO: ${parentDAORoom.name} (${parentDAORoom.roomId})`);
        
        // Get DAO wallet instance
        const daoWallet = DAOMnemonicWallet.getInstance();
        
        // Get user's wallet address from any existing DAO wallet
        const daoWallets = daoWallet.getAllDAOWallets();
        console.log(`🔍 [BALANCE CHECK] DAO wallets found: ${daoWallets.length}`);
        if (daoWallets.length === 0) {
            console.log("❌ [BALANCE CHECK] No DAO wallets found for user");
            return 0;
        }
        
        // Use the first wallet's address (all wallets should have the same address for the same user)
        const userWalletAddress = daoWallets[0].address;
        console.log(`✅ [BALANCE CHECK] User wallet address: ${userWalletAddress}`);
        
        // Get balance from the parent DAO's ledger
        console.log(`🔍 [BALANCE CHECK] Starting ledger balance recovery for DAO: ${parentDAORoom.roomId}`);
        const balance = await daoWallet.recoverBalanceFromLedger(parentDAORoom.roomId, userWalletAddress);
        console.log(`💰 [BALANCE CHECK] Final balance in DAO ${parentDAORoom.name}: ${balance}B`);
        
        // Simulate API delay for realistic UX
        console.log(`⏳ [BALANCE CHECK] Simulating API delay...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log(`✅ [BALANCE CHECK] Balance check completed successfully: ${balance}B`);
        return balance;
    } catch (error) {
        console.error("❌ [BALANCE CHECK] Failed to check B token balance:", error);
        console.error("❌ [BALANCE CHECK] Error details:", {
            message: error.message,
            stack: error.stack,
            userId,
            spaceId
        });
        return 0;
    }
};

/**
 * Check if user can create agenda based on B token requirement
 */
export const canCreateAgenda = async (cli: MatrixClient, spaceId: string, userId: string): Promise<{
    canCreate: boolean;
    required: number;
    current: number;
    message?: string;
}> => {
    try {
        const settings = await getGOVSettings(cli, spaceId);
        if (!settings) {
            return {
                canCreate: true, // No restrictions if no settings
                required: 0,
                current: 0,
            };
        }

        const currentBalance = await checkBTokenBalance(cli, userId, spaceId);
        const canCreate = currentBalance >= settings.bTokenRequired;

        return {
            canCreate,
            required: settings.bTokenRequired,
            current: currentBalance,
            message: canCreate 
                ? undefined 
                : `You need at least ${settings.bTokenRequired}B tokens to create an agenda. Current balance: ${currentBalance.toFixed(2)}B`,
        };
    } catch (error) {
        console.error("Failed to check agenda creation permission:", error);
        return {
            canCreate: false,
            required: 0,
            current: 0,
            message: "Failed to verify token balance",
        };
    }
};
