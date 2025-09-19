/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React, { useState, useEffect, useCallback } from "react";
import { type Room } from "matrix-js-sdk/src/matrix";

import { _t } from "../../../languageHandler";
import AccessibleButton from "../elements/AccessibleButton";
import Field from "../elements/Field";
import Spinner from "../elements/Spinner";
import { DAOMnemonicWallet, type DAOWalletSummary } from "../../../utils/DAOMnemonicWallet";
import { DAOContributionTracker } from "../../../utils/DAOContributionTracker";
import Modal from "../../../Modal";
import InfoDialog from "../dialogs/InfoDialog";
import { MatrixClientPeg } from "../../../MatrixClientPeg";
import SpaceStore from "../../../stores/spaces/SpaceStore";
import defaultDispatcher from "../../../dispatcher/dispatcher";
import { Action } from "../../../dispatcher/actions";

interface Props {
    onClose?: () => void;
}

const MyWalletPanel: React.FC<Props> = ({ onClose }) => {
    const [hasWallet, setHasWallet] = useState(false);
    const [walletData, setWalletData] = useState<any>(null);
    const [walletSummaries, setWalletSummaries] = useState<DAOWalletSummary[]>([]);
    const [mnemonic, setMnemonic] = useState("");
    const [showMnemonicInput, setShowMnemonicInput] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [allSpaces, setAllSpaces] = useState<Room[]>([]);

    const wallet = DAOMnemonicWallet.getInstance();

    const handleWalletUpdate = useCallback(async (newWalletSummaries: DAOWalletSummary[]) => {
        setHasWallet(newWalletSummaries.length > 0);
        
        // 첫 번째 지갑의 정보를 메인 지갑으로 사용 (모든 지갑이 동일하므로)
        if (newWalletSummaries.length > 0) {
            const firstWalletId = newWalletSummaries[0].daoId;
            const mainWallet = wallet.getDAOWallet(firstWalletId);
            setWalletData(mainWallet);
            
            // 모든 프로토콜 DAO 잔액 조회
            try {
                console.log("🔄 MyWalletPanel: Updating wallet summaries...");
                const allBalances = await wallet.getAllProtocolDAOBalances();
                console.log("📊 MyWalletPanel: Received balances:", allBalances);
                setWalletSummaries(allBalances);
            } catch (error) {
                console.error("❌ MyWalletPanel: Failed to get all protocol DAO balances:", error);
                setWalletSummaries(newWalletSummaries);
            }
        } else {
            setWalletData(null);
            setWalletSummaries([]);
        }
    }, [wallet]);

    useEffect(() => {
        const initializeWallet = async () => {
            const existingWallets = wallet.getAllDAOWallets();
            setHasWallet(existingWallets.length > 0);

            // 첫 번째 지갑의 정보를 메인 지갑으로 사용
            if (existingWallets.length > 0) {
                const firstWalletId = existingWallets[0].daoId;
                const mainWallet = wallet.getDAOWallet(firstWalletId);
                setWalletData(mainWallet);
                
                // 모든 프로토콜 DAO 잔액 조회
                try {
                    console.log("🏁 MyWalletPanel: Initial load - getting all protocol DAO balances...");
                    const allBalances = await wallet.getAllProtocolDAOBalances();
                    console.log("📊 MyWalletPanel: Initial load - received balances:", allBalances);
                    setWalletSummaries(allBalances);
                } catch (error) {
                    console.error("❌ MyWalletPanel: Initial load - failed to get all protocol DAO balances:", error);
                    setWalletSummaries(existingWallets);
                }
            } else {
                setWalletSummaries([]);
            }

            // Get all DAO spaces
            const client = MatrixClientPeg.safeGet();
            const spaces = SpaceStore.instance.spacePanelSpaces.filter(space => 
                space.name && space.roomId.startsWith('!')
            );
            setAllSpaces(spaces);
        };

        initializeWallet();

        wallet.addListener(handleWalletUpdate);
        return () => wallet.removeListener(handleWalletUpdate);
    }, [wallet, handleWalletUpdate]);

    const handleCreateNewWallet = useCallback(async () => {
        if (allSpaces.length === 0) {
            setError("DAO 스페이스가 없습니다. 먼저 DAO 스페이스에 가입하세요.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Create wallet for all available DAO spaces
            const firstSpace = allSpaces[0];
            const newWallet = await wallet.createDAOWallet(firstSpace.roomId, firstSpace.name);
            
            // Copy the same wallet to all other DAO spaces
            for (let i = 1; i < allSpaces.length; i++) {
                const space = allSpaces[i];
                await wallet.createDAOWalletFromMnemonic(
                    space.roomId,
                    space.name,
                    "B",
                    1,
                    newWallet.mnemonic
                );
            }

            Modal.createDialog(InfoDialog, {
                title: "Wallet Created Successfully",
                description: (
                    <div>
                        <p><strong>MyWallet has been created!</strong></p>
                        <p>You can use the same wallet across all DAOs.</p>
                        <p>Wallet Address: <code>{newWallet.address}</code></p>
                        <p><em>Please keep your mnemonic phrase in a safe place.</em></p>
                        <div style={{ 
                            backgroundColor: "#f5f5f5", 
                            padding: "15px", 
                            borderRadius: "4px", 
                            fontFamily: "monospace",
                            wordBreak: "break-all",
                            margin: "10px 0",
                            fontSize: "12px",
                            lineHeight: "1.4"
                        }}>
                            <div><strong>Mnemonic:</strong> {newWallet.mnemonic}</div>
                        </div>
                    </div>
                ),
                button: "OK"
            });

            DAOContributionTracker.getInstance().initialize();
            
            // 모든 프로토콜 DAO 잔액 업데이트
            try {
                const allBalances = await wallet.getAllProtocolDAOBalances();
                setWalletSummaries(allBalances);
            } catch (error) {
                console.error("Failed to update all protocol DAO balances:", error);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "지갑 생성 실패");
        } finally {
            setIsLoading(false);
        }
    }, [wallet, allSpaces]);

    const handleRestoreWallet = useCallback(async () => {
        if (!mnemonic.trim()) {
            setError("니모닉 문구를 입력해주세요");
            return;
        }

        if (allSpaces.length === 0) {
            setError("DAO 스페이스가 없습니다. 먼저 DAO 스페이스에 가입하세요.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (!wallet.validateMnemonicPhrase(mnemonic.trim())) {
                throw new Error("유효하지 않은 니모닉 문구입니다");
            }

            // Restore wallet for all available DAO spaces
            for (const space of allSpaces) {
                await wallet.createDAOWalletFromMnemonic(
                    space.roomId,
                    space.name,
                    "B",
                    1,
                    mnemonic.trim()
                );
            }

            Modal.createDialog(InfoDialog, {
                title: "지갑 복구 완료",
                description: (
                    <div>
                        <p><strong>마이월렛이 복구되었습니다!</strong></p>
                        <p>모든 DAO에서 동일한 지갑을 사용할 수 있습니다.</p>
                        <p><em>원장에서 기존 거래 기록을 바탕으로 잔액을 복구했습니다.</em></p>
                    </div>
                ),
                button: "확인"
            });

            DAOContributionTracker.getInstance().initialize();
            
            // 모든 프로토콜 DAO 잔액 업데이트
            try {
                const allBalances = await wallet.getAllProtocolDAOBalances();
                setWalletSummaries(allBalances);
            } catch (error) {
                console.error("Failed to update all protocol DAO balances:", error);
            }
            
            setShowMnemonicInput(false);
            setMnemonic("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "지갑 복원 실패");
        } finally {
            setIsLoading(false);
        }
    }, [wallet, mnemonic, allSpaces]);

    const handleExportWallet = useCallback(() => {
        try {
            if (!walletData) {
                throw new Error("지갑 정보를 찾을 수 없습니다");
            }

            const exportData = `My Wallet Backup\nAddress: ${walletData.address}\nMnemonic: ${walletData.mnemonic}\n\n`;
            
            const blob = new Blob([exportData], { type: "text/plain; charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `my-wallet-backup-${new Date().toISOString().split('T')[0]}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to export wallet:", err);
        }
    }, [walletData]);

    const handleDeleteAllWallets = useCallback(() => {
        if (!walletData) return;

        const confirmed = confirm(
            `Are you sure you want to delete your wallet?\n\nAll DAO wallets will be deleted and can only be recovered with your mnemonic phrase.`
        );

        if (confirmed) {
            try {
                // 모든 DAO의 지갑 삭제
                const allWallets = wallet.getAllDAOWallets();
                allWallets.forEach(walletSummary => {
                    wallet.deleteDAOWallet(walletSummary.daoId);
                });

                setWalletData(null);
                setWalletSummaries([]);
                setHasWallet(false);
                
                Modal.createDialog(InfoDialog, {
                    title: "Wallet Deleted Successfully",
                    description: "All DAO wallets have been deleted. You can recover them anytime with your mnemonic phrase.",
                    button: "확인"
                });
            } catch (err) {
                console.error("Failed to delete wallets:", err);
            }
        }
    }, [walletData, wallet]);

    const handleShowQRCode = useCallback(async () => {
        if (!walletData) return;

        const QRCodeDialog = await import("../dialogs/QRCodeDialog");
        Modal.createDialog(QRCodeDialog.default, {
            address: walletData.address,
            daoName: "My Wallet",
            space: null,
        });
    }, [walletData]);

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat().format(amount);
    };

    const handleNavigateToDAO = useCallback((daoId: string, daoName: string) => {
        console.log(`🔗 Navigating to DAO: ${daoName} (${daoId})`);
        defaultDispatcher.dispatch({
            action: Action.ViewRoom,
            room_id: daoId,
            metricsTrigger: "MyWallet",
        });
        
        // 마이월렛 창 닫기
        if (onClose) {
            onClose();
        }
    }, [onClose]);

    const getDAODisplayId = useCallback((daoId: string, daoName: string) => {
        try {
            const client = MatrixClientPeg.safeGet();
            const room = client.getRoom(daoId);
            if (room) {
                return room.getCanonicalAlias() || `#${daoName?.toLowerCase().replace(/\s+/g, '-')}:${client.getDomain()}`;
            }
            return `#${daoName?.toLowerCase().replace(/\s+/g, '-')}:localhost`;
        } catch (error) {
            return `#${daoName?.toLowerCase().replace(/\s+/g, '-')}:localhost`;
        }
    }, []);


    const renderWalletInfo = () => {
        if (!walletData) return null;

        return (
            <div className="mx_MyWalletPanel_walletInfo">
                <div className="mx_MyWalletPanel_address">
                    <span className="mx_MyWalletPanel_label">Address</span>
                    <div className="mx_MyWalletPanel_addressRow">
                        <div className="mx_MyWalletPanel_addressValue">
                            {walletData.address}
                        </div>
                        <a
                            href="#"
                            className="mx_MyWalletPanel_copyLink"
                            onClick={(e) => {
                                e.preventDefault();
                                navigator.clipboard.writeText(walletData.address);
                                const element = e.currentTarget as HTMLElement;
                                const originalText = element.textContent;
                                element.textContent = "복사됨!";
                                setTimeout(() => {
                                    element.textContent = originalText;
                                }, 1000);
                            }}
                        >
                            Copy
                        </a>
                    </div>
                </div>
                
                <div className="mx_MyWalletPanel_actions">
                    <a
                        href="#"
                        className="mx_MyWalletPanel_actionLink"
                        onClick={(e) => {
                            e.preventDefault();
                            handleExportWallet();
                        }}
                    >
                        Backup
                    </a>
                    <span style={{ margin: "0 12px" }}></span>
                    <a
                        href="#"
                        className="mx_MyWalletPanel_actionLink mx_MyWalletPanel_deleteLink"
                        onClick={(e) => {
                            e.preventDefault();
                            handleDeleteAllWallets();
                        }}
                    >
                        Delete
                    </a>
                    <span style={{ margin: "0 12px" }}></span>
                    <a
                        href="#"
                        className="mx_MyWalletPanel_actionLink"
                        onClick={(e) => {
                            e.preventDefault();
                            handleShowQRCode();
                        }}
                    >
                        QR
                    </a>
                </div>
            </div>
        );
    };

    const renderBalanceCards = () => {
        console.log("🎨 Rendering balance cards. WalletSummaries:", walletSummaries);
        if (walletSummaries.length === 0) {
            console.log("🎨 No wallet summaries to render");
            return null;
        }

        return (
            <div className="mx_MyWalletPanel_balanceList">
                <h4>DAO Balance</h4>
                {walletSummaries.map((summary) => {
                    console.log(`🎨 Rendering card for ${summary.daoName}: ${summary.balance}${summary.currency}`);
                    return (
                        <div key={summary.daoId} className="mx_MyWalletPanel_balanceCard">
                            <div className="mx_MyWalletPanel_balanceHeader">
                                <div className="mx_MyWalletPanel_daoInfo">
                                    <div className="mx_MyWalletPanel_daoMainInfo">
                                        <a
                                            href="#"
                                            className="mx_MyWalletPanel_daoNameLink"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleNavigateToDAO(summary.daoId, summary.daoName);
                                            }}
                                        >
                                            {summary.daoName} Network
                                        </a>
                                        <span style={{ margin: "0 8px" }}></span>
                                        <span 
                                            className="mx_MyWalletPanel_daoId"
                                            style={{ fontSize: "10px" }}
                                        >
                                            {getDAODisplayId(summary.daoId, summary.daoName)}
                                        </span>
                                    </div>
                                </div>
                                <div className="mx_MyWalletPanel_balanceAmount">
                                    {formatCurrency(summary.balance)} {summary.currency}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderContent = () => {
        if (hasWallet) {
            return (
                <>
                    {renderWalletInfo()}
                    {renderBalanceCards()}
                </>
            );
        }

        return (
            <div className="mx_MyWalletPanel_card">
                <h3>My Wallet</h3>
                <p>Create a new wallet or restore an existing one</p>
                
                {error && (
                    <div className="mx_MyWalletPanel_error">
                        {error}
                    </div>
                )}

                {!showMnemonicInput ? (
                    <>
                        <AccessibleButton
                            kind="primary"
                            onClick={handleCreateNewWallet}
                            disabled={isLoading}
                            className="mx_MyWalletPanel_createButton"
                        >
                            {isLoading ? <Spinner w={16} h={16} /> : "Create New Wallet"}
                        </AccessibleButton>

                        <AccessibleButton
                            kind="link"
                            onClick={() => setShowMnemonicInput(true)}
                            disabled={isLoading}
                            className="mx_MyWalletPanel_restoreButton"
                        >
                            Restore Existing Wallet
                        </AccessibleButton>
                    </>
                ) : (
                    <div className="mx_MyWalletPanel_restoreForm">
                        <Field
                            label="Mnemonic Phrase (12 words)"
                            placeholder="word1 word2 word3 ..."
                            value={mnemonic}
                            onChange={(e) => setMnemonic(e.target.value)}
                            type="text"
                        />
                        
                        <div className="mx_MyWalletPanel_restoreActions">
                            <AccessibleButton
                                kind="primary"
                                onClick={handleRestoreWallet}
                                disabled={isLoading || !mnemonic.trim()}
                            >
                                {isLoading ? <Spinner w={16} h={16} /> : "Restore"}
                            </AccessibleButton>
                            
                            <AccessibleButton
                                kind="secondary"
                                onClick={() => {
                                    setShowMnemonicInput(false);
                                    setMnemonic("");
                                    setError(null);
                                }}
                                disabled={isLoading}
                            >
                                Cancel
                            </AccessibleButton>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mx_MyWalletPanel">
            {renderContent()}
        </div>
    );
};

export default MyWalletPanel;
