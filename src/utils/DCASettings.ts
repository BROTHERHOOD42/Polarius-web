/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import { EventType, type Room } from "matrix-js-sdk/src/matrix";
import { logger } from "matrix-js-sdk/src/logger";
import SpaceStore from "../stores/spaces/SpaceStore";

// DCA 설정 이벤트 타입
const DCA_SETTINGS_EVENT_TYPE = "org.polarius.dca.settings";

// DCA 설정 인터페이스
export interface DCASettings {
    allowSelfVerification: boolean;
}

// 기본 DCA 설정
const DEFAULT_DCA_SETTINGS: DCASettings = {
    allowSelfVerification: true, // 기본적으로 본인 검증 허용
};

/**
 * DCA 스페이스에서 설정을 가져옵니다.
 * @param room DCA 스페이스 룸
 * @returns DCA 설정 객체
 */
export function getDCASettings(room: Room): DCASettings {
    if (!room || !room.isSpaceRoom()) {
        return DEFAULT_DCA_SETTINGS;
    }

    try {
        const settingsEvent = room.currentState.getStateEvents(DCA_SETTINGS_EVENT_TYPE, "");
        if (settingsEvent && settingsEvent.getContent()) {
            const content = settingsEvent.getContent() as DCASettings;
            return {
                allowSelfVerification: content.allowSelfVerification ?? DEFAULT_DCA_SETTINGS.allowSelfVerification,
            };
        }
    } catch (error) {
        logger.error("Failed to get DCA settings:", error);
    }

    return DEFAULT_DCA_SETTINGS;
}

/**
 * DCA 스페이스에서 설정을 저장합니다.
 * @param room DCA 스페이스 룸
 * @param settings 저장할 DCA 설정
 * @returns Promise<boolean> 성공 여부
 */
export async function setDCASettings(room: Room, settings: DCASettings): Promise<boolean> {
    if (!room || !room.isSpaceRoom()) {
        logger.error("Room is not a space room");
        return false;
    }

    try {
        await room.client.sendStateEvent(room.roomId, DCA_SETTINGS_EVENT_TYPE, settings, "");
        logger.info("DCA settings saved successfully");
        return true;
    } catch (error) {
        logger.error("Failed to save DCA settings:", error);
        return false;
    }
}

/**
 * 본인 검증이 허용되는지 확인합니다.
 * @param room DCA 스페이스 룸
 * @returns boolean 본인 검증 허용 여부
 */
export function isSelfVerificationAllowed(room: Room): boolean {
    const settings = getDCASettings(room);
    return settings.allowSelfVerification;
}

/**
 * 본인 검증 설정을 토글합니다.
 * @param room DCA 스페이스 룸
 * @returns Promise<boolean> 성공 여부
 */
export async function toggleSelfVerification(room: Room): Promise<boolean> {
    const currentSettings = getDCASettings(room);
    const newSettings: DCASettings = {
        ...currentSettings,
        allowSelfVerification: !currentSettings.allowSelfVerification,
    };
    
    return await setDCASettings(room, newSettings);
}

/**
 * 룸에서 DCA 스페이스를 찾습니다.
 * @param room 룸 (DCA 룸 또는 DCA 스페이스)
 * @returns DCA 스페이스 룸 또는 null
 */
export function findDCASpace(room: Room): Room | null {
    if (!room) return null;
    
    const client = room.client;
    
    // If this is already a DCA space, return it
    if (room.isSpaceRoom() && room.name === "DCA") {
        return room;
    }
    
    // Look for DCA space in parents
    const spaceEvents = room.currentState.getStateEvents(EventType.SpaceParent);
    
    for (const event of spaceEvents) {
        const parentRoomId = event.getStateKey();
        if (!parentRoomId) continue;
        
        const parentRoom = client.getRoom(parentRoomId);
        if (!parentRoom) continue;
        
        // Check if parent is DCA space
        if (parentRoom.isSpaceRoom() && parentRoom.name === "DCA") {
            return parentRoom;
        }
        
        // Recursively check parent
        const dcaSpace = findDCASpace(parentRoom);
        if (dcaSpace) return dcaSpace;
    }
    
    return null;
}
