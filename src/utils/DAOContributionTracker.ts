import { MatrixEvent, EventType, MsgType, RelationType, Room } from "matrix-js-sdk/src/matrix";
import { MatrixClientPeg } from "../MatrixClientPeg";
import { DAOMnemonicWallet } from "./DAOMnemonicWallet";
import SpaceStore from "../stores/spaces/SpaceStore";

export interface ContributionEvent {
    userId: string;
    daoId: string;
    daoName: string;
    roomId: string;
    eventType: 'chat' | 'react';
    timestamp: number;
    contributionValue: number;
}

export class DAOContributionTracker {
    private static instance: DAOContributionTracker;
    private wallet = DAOMnemonicWallet.getInstance();
    private recentContributions: Map<string, number> = new Map(); // userId+daoId -> timestamp
    private readonly CONTRIBUTION_COOLDOWN = 0; // 쿨다운 없음
    private isInitialized = false;
    private processedVerifications: Set<string> = new Set(); // 중복 처리 방지: eventId+verifierId (자신이 검증한 것만)

    static getInstance(): DAOContributionTracker {
        if (!DAOContributionTracker.instance) {
            DAOContributionTracker.instance = new DAOContributionTracker();
        }
        return DAOContributionTracker.instance;
    }

    // DCA 룸인지 확인 (DCA 스페이스 안의 모든 룸)
    private isDCARoom(roomId: string): boolean {
        const client = MatrixClientPeg.safeGet();
        const room = client.getRoom(roomId);
        
        console.log("🔍 Checking if room is DCA:", {
            roomId,
            roomName: room?.name,
            isRoom: !!room
        });
        
        if (!room) {
            console.log("❌ Room not found");
            return false;
        }

        // DCA 스페이스 안의 룸인지 확인
        const spaceEvents = room.currentState.getStateEvents(EventType.SpaceParent);
        console.log("🔍 Checking parent spaces:", spaceEvents.length);
        
        for (const event of spaceEvents) {
            const parentRoomId = event.getStateKey();
            if (!parentRoomId) continue;

            const parentRoom = client.getRoom(parentRoomId);
            console.log("🔍 Parent room:", {
                parentRoomId,
                parentName: parentRoom?.name,
                isSpace: parentRoom?.isSpaceRoom()
            });
            
            // 부모가 DCA 스페이스인지 확인
            if (parentRoom?.isSpaceRoom() && parentRoom.name === "DCA") {
                console.log("✅ Found DCA room in DCA space:", room.name);
                return true;
            }
        }

        console.log("❌ Not in DCA space");
        return false;
    }

    // Ledger 룸 찾기
    private findLedgerRoom(daoSpaceId: string): Room | null {
        const client = MatrixClientPeg.safeGet();
        const daoSpace = client.getRoom(daoSpaceId);
        if (!daoSpace) return null;

        // DAO 스페이스의 하위 룸들 중에서 ledger 룸 찾기
        const children = SpaceStore.instance.getChildren(daoSpaceId);
        for (const child of children) {
            const room = client.getRoom(child.roomId);
            if (room && !room.isSpaceRoom() && room.name === "ledger") {
                return room;
            }
        }
        return null;
    }

    // DAO 정보 가져오기 (단순화)
    private getDAOInfo(dcaRoomId: string): { daoId: string; daoName: string; contributionValue: number; ledgerRoom: Room | null } | null {
        const client = MatrixClientPeg.safeGet();
        const dcaRoom = client.getRoom(dcaRoomId);
        
        if (!dcaRoom) return null;

        // DCA 룸의 부모 DCA 스페이스 찾기
        const spaceEvents = dcaRoom.currentState.getStateEvents(EventType.SpaceParent);
        
        for (const event of spaceEvents) {
            const dcaSpaceId = event.getStateKey();
            if (!dcaSpaceId) continue;

            const dcaSpace = client.getRoom(dcaSpaceId);
            if (!dcaSpace?.isSpaceRoom() || dcaSpace.name !== "DCA") continue;

            // DCA 스페이스의 부모 DAO 스페이스 찾기
            const daoSpaceEvents = dcaSpace.currentState.getStateEvents(EventType.SpaceParent);
            
            for (const daoEvent of daoSpaceEvents) {
                const daoSpaceId = daoEvent.getStateKey();
                if (!daoSpaceId) continue;

                const daoSpace = client.getRoom(daoSpaceId);
                if (!daoSpace?.isSpaceRoom()) continue;

                // DCA 룸에서 직접 기여가치 추출 (토픽에서)
                const dcaRoomTopic = dcaRoom.currentState.getStateEvents(EventType.RoomTopic, "")?.getContent()?.topic || "";
                console.log("🔍 DCA Room Topic:", dcaRoomTopic);
                const contributionMatch = dcaRoomTopic.match(/Kudos Value:\s*(\d+)(?:\w*)/i);
                const contributionValue = contributionMatch ? parseInt(contributionMatch[1]) : 10;
                console.log("💰 Extracted kudos value from DCA room:", contributionValue);

                // Ledger 룸 찾기
                const ledgerRoom = this.findLedgerRoom(daoSpaceId);
                console.log("📚 Ledger room found:", ledgerRoom?.name);

                return {
                    daoId: daoSpaceId,
                    daoName: daoSpace.name || "Unknown DAO",
                    contributionValue,
                    ledgerRoom
                };
            }
        }

        return null;
    }

    // 쿨다운 확인
    private isOnCooldown(userId: string, daoId: string): boolean {
        const key = `${userId}:${daoId}`;
        const lastContribution = this.recentContributions.get(key) || 0;
        return Date.now() - lastContribution < this.CONTRIBUTION_COOLDOWN;
    }

    // 쿨다운 설정
    private setCooldown(userId: string, daoId: string): void {
        const key = `${userId}:${daoId}`;
        this.recentContributions.set(key, Date.now());
    }

    // 원장 룸에 거래 기록
    private async recordTransaction(
        ledgerRoom: Room,
        dcaRoomName: string,
        daoName: string,
        recipientWalletAddress: string,
        amount: number,
        verifierName: string,
        verifierUserId: string
    ): Promise<void> {
        console.log("🏦 Starting recordTransaction...");
        console.log("📊 Transaction parameters:", {
            ledgerRoomId: ledgerRoom.roomId,
            dcaRoomName,
            daoName,
            recipientWalletAddress,
            amount,
            verifierName,
            verifierUserId
        });
        
        try {
            const client = MatrixClientPeg.safeGet();
            
            // 현재 잔액 조회 (이전 트랜잭션에서) - 시간 제한 설정
            let currentBalance = 0;
            try {
                const balancePromise = this.getLatestBalanceFromLedger(ledgerRoom, recipientWalletAddress);
                const timeoutPromise = new Promise<number>((_, reject) => 
                    setTimeout(() => reject(new Error("Balance check timeout")), 5000)
                );
                currentBalance = await Promise.race([balancePromise, timeoutPromise]);
            } catch (balanceError) {
                console.warn("⚠️ Could not get current balance, using 0:", balanceError);
                currentBalance = 0;
            }
            const newBalance = currentBalance + amount;
            
            // 기본 트랜잭션 데이터 생성
            const basicTxData = {
                type: `PoC: ${dcaRoomName}`,
                from: `${daoName} minting`,
                to: recipientWalletAddress,
                amount: amount,
                balance: newBalance, // 새로운 잔액 추가
                verifier: verifierName,
                verifierUserId: verifierUserId,
                timestamp: Date.now(),
            };

            // 트랜잭션 해시 생성
            const txHash = this.generateTransactionHash(recipientWalletAddress, amount, basicTxData.timestamp);
            
            // 서명할 데이터 문자열 생성
            const dataToSign = `${basicTxData.type}|${basicTxData.from}|${basicTxData.to}|${basicTxData.amount}|${basicTxData.timestamp}|${txHash}`;
            
            // 검증자의 DAO 지갑으로 디지털 서명 생성  
            let digitalSignature = null;
            // 우선 원장 기록에서 DAO ID 추출 시도
            const ledgerSpaceEvents = ledgerRoom.currentState.getStateEvents(EventType.SpaceParent);
            let parentDaoId = null;
            
            for (const event of ledgerSpaceEvents) {
                const parentId = event.getStateKey();
                if (parentId) {
                    const parentRoom = MatrixClientPeg.safeGet().getRoom(parentId);
                    if (parentRoom?.isSpaceRoom() && parentRoom.name !== "DCA") {
                        parentDaoId = parentId;
                        break;
                    }
                }
            }
            
            if (parentDaoId && this.wallet.hasDAOWallet(parentDaoId)) {
                digitalSignature = this.wallet.signData(parentDaoId, dataToSign);
                console.log("🔐 Digital signature generated with DAO wallet:", digitalSignature?.substring(0, 16) + "...");
            } else {
                console.warn("⚠️ No DAO wallet available for digital signature, proceeding without signature");
                digitalSignature = "unsigned_transaction";
            }

            const transactionData = {
                ...basicTxData,
                txHash,
                signature: digitalSignature,
                dataToSign // 검증용으로 포함
            };

            console.log("📝 Recording transaction to ledger:", transactionData);
            console.log("📤 Sending message to ledger room:", {
                roomId: ledgerRoom.roomId,
                roomName: ledgerRoom.name,
                currentUserId: client.getSafeUserId()
            });

            const sendResult = await client.sendEvent(ledgerRoom.roomId, EventType.RoomMessage, {
                msgtype: MsgType.Text,
                body: `🏦 TRANSACTION RECORD 🏦\n${JSON.stringify(transactionData, null, 2)}`,
                format: "org.matrix.custom.html",
                formatted_body: `
                    <h3>🏦 TRANSACTION RECORD 🏦</h3>
                    <table border="1" style="border-collapse: collapse; width: 100%;">
                        <tr><td><b>Type</b></td><td>${transactionData.type}</td></tr>
                        <tr><td><b>From</b></td><td>${transactionData.from}</td></tr>
                        <tr><td><b>To</b></td><td>${transactionData.to}</td></tr>
                        <tr><td><b>Amount</b></td><td>${transactionData.amount}B</td></tr>
                        <tr><td><b>Balance</b></td><td>${transactionData.balance}B</td></tr>
                        <tr><td><b>Verifier</b></td><td>${transactionData.verifier}</td></tr>
                        <tr><td><b>Verifier ID</b></td><td><code>${transactionData.verifierUserId}</code></td></tr>
                        <tr><td><b>Timestamp</b></td><td>${new Date(transactionData.timestamp).toISOString()}</td></tr>
                        <tr><td><b>TX Hash</b></td><td><code>${transactionData.txHash}</code></td></tr>
                        <tr><td><b>Digital Signature</b></td><td><code>${transactionData.signature ? transactionData.signature.substring(0, 32) + "..." : "N/A"}</code></td></tr>
                        <tr><td><b>Signature Status</b></td><td>${transactionData.signature ? "✅ Signed" : "❌ Unsigned"}</td></tr>
                    </table>
                `,
                transaction_data: transactionData // 원장 처리용 메타데이터
            });

            console.log("✅ Transaction recorded to ledger successfully");
            console.log("📬 Send result:", {
                eventId: sendResult?.event_id,
                successful: !!sendResult?.event_id
            });
        } catch (error) {
            console.error("💥 Failed to record transaction to ledger:", error);
            throw error; // 에러를 다시 던져서 상위에서 처리하도록 함
        }
    }

    // 원장에서 특정 지갑 주소의 최신 잔액 조회 (빠른 버전)
    private async getLatestBalanceFromLedger(ledgerRoom: Room, walletAddress: string): Promise<number> {
        try {
            console.log(`🔍 Getting latest balance for ${walletAddress} (quick check)`);
            
            const timeline = ledgerRoom.getLiveTimeline();
            const currentEvents = timeline.getEvents();
            console.log(`📝 Checking ${currentEvents.length} currently loaded events`);
            
            // 현재 로드된 이벤트에서만 검색 (빠른 처리)
            const eventsReversed = [...currentEvents].reverse();
            
            for (const event of eventsReversed) {
                if (event.getType() === EventType.RoomMessage) {
                    const content = event.getContent();
                    const transactionData = content.transaction_data;
                    
                    if (transactionData && 
                        transactionData.to === walletAddress && 
                        typeof transactionData.balance === 'number') {
                        console.log(`💰 Found latest balance for ${walletAddress}: ${transactionData.balance}B`);
                        return transactionData.balance;
                    }
                }
            }
            
            console.log(`💰 No previous balance found in loaded events for ${walletAddress}, starting from 0`);
            return 0;
        } catch (error) {
            console.error("Error reading balance from ledger:", error);
            return 0;
        }
    }

    // 거래 해시 생성 (간단한 구현)
    private generateTransactionHash(to: string, amount: number, timestamp: number): string {
        const data = `${to}-${amount}-${timestamp}`;
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bit integer
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    }

    // 채팅 이벤트 처리 (비활성화 - Verification 버튼만 사용)
    handleChatEvent(event: MatrixEvent): void {
        // 채팅으로는 기여증명 발행하지 않음
        console.log("Chat event ignored - only Verification button awards contributions");
        return;
    }

    // Verification 이벤트 처리 (일반 react와 구분)
    async handleVerificationEvent(event: MatrixEvent): Promise<void> {
        try {
            console.log("🔥 VERIFICATION EVENT START:", {
                type: event.getType(),
                sender: event.getSender(),
                content: event.getContent(),
                roomId: event.getRoomId(),
                eventId: event.getId()
            });
            
            // Reaction 이벤트인지 확인 (annotation relation)
            const content = event.getContent();
            if (content?.["m.relates_to"]?.rel_type !== RelationType.Annotation) {
                console.log("❌ Not an annotation reaction, skipping");
                return;
            }

            // Verification 이벤트인지 확인 (일반 react는 무시)
            if (!content.verification || content.verification !== true) {
                console.log("❌ Not a verification event, skipping contribution award");
                return;
            }
            
            console.log("✅ VERIFICATION EVENT CONFIRMED, processing contribution award");

            const roomId = event.getRoomId();
            if (!roomId || !this.isDCARoom(roomId)) {
                console.log("Not a DCA room, skipping");
                return;
            }

            // 리액트를 받은 원본 메시지 찾기
            const relatesTo = content["m.relates_to"];
            const originalEventId = relatesTo?.event_id;
            
            console.log("🔍 Looking for original event:", {
                originalEventId,
                relatesTo
            });
            
            if (!originalEventId) {
                console.log("❌ No original event ID found, skipping");
                return;
            }

            const client = MatrixClientPeg.safeGet();
            const room = client.getRoom(roomId);
            
            console.log("🏠 Room info:", {
                roomId,
                roomExists: !!room,
                roomName: room?.name
            });
            
            const originalEvent = room?.findEventById(originalEventId);
            
            console.log("📝 Original event search result:", {
                originalEventId,
                eventFound: !!originalEvent,
                eventType: originalEvent?.getType(),
                eventSender: originalEvent?.getSender()
            });
            
            if (!originalEvent) {
                console.log("❌ Original event not found in room timeline");
                console.log("💡 This might happen if the message is not loaded in the current timeline");
                
                // 이벤트가 로드되지 않은 경우 타임라인에서 다시 시도
                try {
                    console.log("🔄 Attempting to fetch event from server...");
                    console.log("📡 Fetch parameters:", {
                        roomId,
                        originalEventId
                    });
                    
                    const fetchedEvent = await client.fetchRoomEvent(roomId, originalEventId);
                    
                    if (fetchedEvent) {
                        console.log("✅ Successfully fetched event from server:", {
                            sender: fetchedEvent.sender,
                            type: fetchedEvent.type,
                            content: fetchedEvent.content,
                            hasWalletAddress: !!fetchedEvent.content?.wallet_address,
                            hasDaoId: !!fetchedEvent.content?.dao_id
                        });
                        
                        // MatrixEvent 객체로 변환
                        const matrixEvent = new MatrixEvent(fetchedEvent);
                        
                        // 이 이벤트로 계속 진행
                        console.log("📋 Processing with fetched event...");
                        await this.processVerificationForEvent(matrixEvent, event.getSender(), roomId);
                        return;
                    } else {
                        console.log("❌ fetchRoomEvent returned null/undefined");
                    }
                } catch (fetchError) {
                    console.error("❌ Failed to fetch event from server:", fetchError);
                    console.error("🔍 Error details:", {
                        name: fetchError.name,
                        message: fetchError.message,
                        code: fetchError.code || 'unknown'
                    });
                }
                
                console.log("❌ Unable to find original event, skipping verification");
                return;
            }

            // 검증 처리 진행 (이미 processVerificationForEvent에서 중복 체크를 하므로 안전)
            await this.processVerificationForEvent(originalEvent, event.getSender(), roomId);
        } catch (error) {
            console.error("💥 Error handling react event:", error);
        }
    }

    // 검증 이벤트 처리 (별도 함수로 분리) - 외부에서 직접 호출 가능하도록 public으로 변경
    public async processVerificationForEvent(originalEvent: MatrixEvent, verifierUserId: string, roomId: string): Promise<void> {
        try {
            // 중복 처리 방지
            const verificationKey = `${originalEvent.getId()}-${verifierUserId}`;
            if (this.processedVerifications.has(verificationKey)) {
                console.log("⚠️ Verification already processed, skipping duplicate:", verificationKey);
                return;
            }
            this.processedVerifications.add(verificationKey);
            
            // 원본 메시지 작성자(기여자)에게 토큰 지급
            const originalAuthor = originalEvent.getSender();
            console.log("💰 Rewarding contributor:", originalAuthor);
            console.log("🔍 Verifier:", verifierUserId);

            // 원본 메시지에서 지갑 주소 추출
            const originalContent = originalEvent.getContent();
            const contributorWalletAddress = originalContent.wallet_address;
              
            if (!contributorWalletAddress) {
                console.log("❌ No wallet address found in original message, skipping");
                console.log("📋 Original message content:", {
                    body: originalContent.body,
                    msgtype: originalContent.msgtype,
                    hasWalletAddress: !!originalContent.wallet_address,
                    hasDaoId: !!originalContent.dao_id
                });
                return;
            }

            console.log("💳 Contributor wallet address:", contributorWalletAddress);

            const daoInfo = this.getDAOInfo(roomId);
            if (!daoInfo) {
                console.log("❌ No DAO info found, skipping");
                return;
            }

            // 검증자가 해당 DAO의 지갑을 가지고 있는지 확인
            if (!this.wallet.hasDAOWallet(daoInfo.daoId)) {
                console.warn("⚠️ Verifier does not have DAO wallet for:", daoInfo.daoName);
                console.warn("💡 Verification will proceed but transaction may not be signed properly");
                // 검증은 계속 진행하되, 서명 없이 트랜잭션 기록
            }

            // 쿨다운 확인 (기여자 기준)
            if (this.isOnCooldown(originalAuthor, daoInfo.daoId)) {
                console.log("⏰ Contribution on cooldown for contributor", originalAuthor);
                return;
            }

            console.log("💎 Processing verification contribution for DAO:", daoInfo.daoName);
            
            const client = MatrixClientPeg.safeGet();
            const room = client.getRoom(roomId);
            const dcaRoomName = room?.name || "Unknown Room";
            
            // 기여자에게 기여가치 지급 (검증자가 검증→원장→기여자 지갑)
            await this.awardContribution(originalAuthor, contributorWalletAddress, daoInfo, 'react', dcaRoomName, verifierUserId);
        } catch (error) {
            console.error("💥 Error processing verification for event:", error);
        }
    }

    // 기여가치 지급
    private async awardContribution(
        contributorUserId: string,
        contributorWalletAddress: string,
        daoInfo: { daoId: string; daoName: string; contributionValue: number; ledgerRoom: Room | null }, 
        eventType: 'chat' | 'react',
        dcaRoomName: string,
        verifierUserId: string
    ): Promise<void> {
        console.log("💰 Awarding contribution:", {
            contributorUserId,
            contributorWalletAddress,
            daoName: daoInfo.daoName,
            contributionValue: daoInfo.contributionValue,
            eventType,
            dcaRoomName,
            verifierUserId
        });

        try {
            // 1단계: 기여자의 지갑 주소 사용 (메시지에서 추출된 주소)
            const recipientWalletAddress = contributorWalletAddress;

            // 2단계: 검증자 이름 가져오기
            const client = MatrixClientPeg.safeGet();
            const verifierUser = client.getUser(verifierUserId);
            const verifierName = verifierUser?.displayName || verifierUserId;

            // 3단계: 원장 룸에 거래 기록 (있는 경우) - 실패해도 계속 진행
            console.log("📋 Preparing ledger transaction...");
            console.log("🏦 Ledger room status:", {
                hasLedgerRoom: !!daoInfo.ledgerRoom,
                ledgerRoomId: daoInfo.ledgerRoom?.roomId,
                ledgerRoomName: daoInfo.ledgerRoom?.name
            });
            
            if (daoInfo.ledgerRoom) {
                console.log("💰 Recording transaction details:", {
                    dcaRoomName,
                    daoName: daoInfo.daoName,
                    recipientWalletAddress,
                    contributionValue: daoInfo.contributionValue,
                    verifierName,
                    verifierUserId
                });
                
                try {
                    await this.recordTransaction(
                        daoInfo.ledgerRoom,
                        dcaRoomName,
                        daoInfo.daoName,
                        recipientWalletAddress,
                        daoInfo.contributionValue,
                        verifierName,
                        verifierUserId
                    );
                    console.log("✅ Ledger transaction recorded successfully");
                } catch (error) {
                    console.error("⚠️ Ledger recording failed, but continuing with wallet update:", error);
                    console.error("🔍 Ledger error details:", {
                        name: error.name,
                        message: error.message,
                        stack: error.stack?.split('\n')[0] // 첫 번째 스택 라인만
                    });
                }
            } else {
                console.log("⚠️ No ledger room found, proceeding without ledger record");
                console.log("🔍 DAO space structure check needed for:", daoInfo.daoId);
            }

            // 4단계: 기여자 지갑에 토큰 지급 (원장 기록 결과와 관계없이 진행)
            try {
                // 기여자의 DAO 지갑이 있는지 확인하고 업데이트
                console.log("💰 Updating contributor's wallet balance...");
                
                // 기여자의 지갑을 찾기 (지갑 주소로 매칭)
                const allWallets = this.wallet.getAllDAOWallets();
                const contributorWallet = allWallets.find(w => w.address === contributorWalletAddress && w.daoId === daoInfo.daoId);
                
                if (contributorWallet) {
                    // 기여자의 지갑에 토큰 지급 (설정된 기여가치만큼)
                    const awarded = this.wallet.awardContribution(daoInfo.daoId, daoInfo.contributionValue);
                    
                    if (awarded) {
                        this.setCooldown(contributorUserId, daoInfo.daoId);

                        // 알림 표시
                        this.showContributionNotification(
                            daoInfo.daoName,
                            daoInfo.contributionValue,
                            eventType
                        );

                        console.log("✅ Complete flow: Verification → Contributor wallet updated successfully");
                    } else {
                        console.log("❌ Failed to update contributor wallet");
                    }
                } else {
                    console.log("⚠️ Contributor's wallet not found in local wallets, but transaction recorded");
                    // 원장에는 기록되었으니 기여자가 나중에 지갑을 복구하면 잔액이 반영됨
                    this.setCooldown(contributorUserId, daoInfo.daoId);
                }
            } catch (walletError) {
                console.error("💥 Error updating contributor wallet:", walletError);
            }
        } catch (error) {
            console.error("💥 Error in contribution award flow:", error);
        }
    }

    // 기여 알림 표시
    private showContributionNotification(daoName: string, amount: number, eventType: 'chat' | 'react'): void {
        // 간단한 토스트 알림 (실제로는 더 정교한 알림 시스템 사용 권장)
        const message = `🎉 ${daoName}에서 ${amount} 토큰을 받았습니다! (${eventType === 'chat' ? '채팅' : '반응'})`;
        
        // 브라우저 알림 또는 토스트 메시지 표시
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('DAO 기여 수익', {
                body: message,
                icon: '/favicon.ico'
            });
        } else {
            // 콘솔에 로그 (실제로는 UI 토스트 메시지로 교체)
            console.log(message);
        }
    }

    // 이벤트 리스너 등록 (지연 초기화)
    initialize(): void {
        if (this.isInitialized) {
            console.log("⚠️ DAO Contribution Tracker already initialized, skipping...");
            return;
        }

        const client = MatrixClientPeg.safeGet();
        console.log("🚀 Initializing DAO Contribution Tracker...");

        // 매우 제한적인 타임라인 이벤트 리스너 (DCA 룸 + 기여 관련 이벤트만)
        client.on("Room.timeline" as any, (event: MatrixEvent, room: Room | undefined) => {
            try {
                const eventType = event.getType();
                const content = event.getContent();
                
                // Reaction 이벤트만 처리
                if (eventType !== EventType.Reaction) {
                    return;
                }
                
                // 디버깅: Reaction 이벤트 로깅
                console.log("🔍 Reaction event:", {
                    type: eventType,
                    content: content,
                    verification: content?.verification,
                    relatesTo: content?.["m.relates_to"],
                    sender: event.getSender()
                });
                
                // Verification 이벤트 확인
                const isVerification = content?.["m.relates_to"]?.rel_type === RelationType.Annotation && content?.verification === true;
                
                if (!isVerification) {
                    console.log("❌ Not a verification event, skipping");
                    return;
                }
                
                console.log("✅ Verification event found!");

                // DCA 룸이 아니면 바로 종료
                const roomId = event.getRoomId();
                console.log("🔍 Checking if DCA room:", roomId);
                if (!roomId || !this.isDCARoom(roomId)) {
                    console.log("❌ Not a DCA room, skipping");
                    return;
                }
                console.log("✅ DCA room confirmed!");
                
                console.log("📧 DCA Verification Timeline event:", {
                    type: eventType,
                    sender: event.getSender(),
                    room: room?.name,
                    roomId: roomId,
                    originalEventId: content?.["m.relates_to"]?.event_id
                });
                
                // Verification 이벤트 처리
                console.log("✅ Processing DCA Verification");
                this.handleVerificationEvent(event).catch(error => {
                    console.error("💥 Error in verification event handling:", error);
                });
            } catch (error) {
                console.error("💥 Error processing timeline event:", error);
            }
        });

        this.isInitialized = true;
        console.log("✅ DAO Contribution Tracker initialized successfully");
    }

    // 메시지에서 공개키 추출
    extractPublicKeyFromEvent(event: MatrixEvent): string | null {
        try {
            const content = event.getContent();
            const body = content.body || '';
            
            console.log("🔍 Extracting public key from event:", {
                eventId: event.getId(),
                content: content,
                body: body,
                bodyLength: body.length,
                fullEvent: event.event
            });
            
            // 1. 메시지 본문에서 공개키 패턴 찾기 (예: 0x로 시작하는 40자리 hex)
            const publicKeyMatch = body.match(/0x[a-fA-F0-9]{40}/);
            if (publicKeyMatch) {
                console.log("✅ Found public key with 0x prefix:", publicKeyMatch[0]);
                return publicKeyMatch[0];
            }
            
            // 2. 다른 패턴들도 시도
            const hexMatch = body.match(/[a-fA-F0-9]{40}/);
            if (hexMatch) {
                console.log("✅ Found public key without 0x prefix:", hexMatch[0]);
                return '0x' + hexMatch[0];
            }
            
            // 3. 더 넓은 범위의 hex 패턴 시도 (32-64자리)
            const wideHexMatch = body.match(/[a-fA-F0-9]{32,64}/);
            if (wideHexMatch) {
                console.log("✅ Found wide hex pattern:", wideHexMatch[0]);
                return '0x' + wideHexMatch[0];
            }
            
            // 4. content의 다른 필드들 확인
            const contentStr = JSON.stringify(content);
            const contentPublicKeyMatch = contentStr.match(/0x[a-fA-F0-9]{40}/);
            if (contentPublicKeyMatch) {
                console.log("✅ Found public key in content:", contentPublicKeyMatch[0]);
                return contentPublicKeyMatch[0];
            }
            
            // 5. 전체 이벤트에서 검색
            const eventStr = JSON.stringify(event.event);
            const eventPublicKeyMatch = eventStr.match(/0x[a-fA-F0-9]{40}/);
            if (eventPublicKeyMatch) {
                console.log("✅ Found public key in event:", eventPublicKeyMatch[0]);
                return eventPublicKeyMatch[0];
            }
            
            // 6. 특정 필드들 확인
            if (content.wallet_address) {
                console.log("✅ Found wallet_address field:", content.wallet_address);
                return content.wallet_address;
            }
            
            if (content.public_key) {
                console.log("✅ Found public_key field:", content.public_key);
                return content.public_key;
            }
            
            if (content.address) {
                console.log("✅ Found address field:", content.address);
                return content.address;
            }
            
            console.log("❌ No public key pattern found anywhere in the event");
            return null;
        } catch (error) {
            console.error("Failed to extract public key from event:", error);
            return null;
        }
    }

    // 정리
    cleanup(): void {
        // 이벤트 리스너 제거는 Matrix 클라이언트가 처리
        this.recentContributions.clear();
    }
}

export default DAOContributionTracker;
