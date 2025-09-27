/*
Copyright 2024 New Vector Ltd.
Copyright 2019-2023 The Matrix.org Foundation C.I.C.
Copyright 2019-2023 New Vector Ltd

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React, { useState } from "react";
import { type MatrixEvent, RelationType, EventType } from "matrix-js-sdk/src/matrix";
import { _t } from "../../../languageHandler";
import BaseDialog from "./BaseDialog";
import DialogButtons from "../elements/DialogButtons";
import DAOContributionTracker from "../../../utils/DAOContributionTracker";
import { MatrixClientPeg } from "../../../MatrixClientPeg";

interface IProps {
    onFinished: (confirmed: boolean) => void;
    mxEvent: MatrixEvent;
}

export const CheckPublicKeyDialog: React.FC<IProps> = ({ onFinished, mxEvent }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    // Extract public key from the message
    const getPublicKeyFromMessage = (): string | null => {
        try {
            const tracker = DAOContributionTracker.getInstance();
            const publicKey = tracker.extractPublicKeyFromEvent(mxEvent);
            return publicKey;
        } catch (error) {
            console.error("Failed to extract public key from message:", error);
            return null;
        }
    };

    const publicKey = getPublicKeyFromMessage();

    const handleConfirm = async () => {
        setIsProcessing(true);
        try {
            // Process the verification
            const client = MatrixClientPeg.safeGet();
            const eventId = mxEvent.getId();
            const roomId = mxEvent.getRoomId();
            
            if (!eventId || !roomId) {
                console.error("Missing event ID or room ID for verification");
                return;
            }
            
            console.log("🔥 DCA VERIFICATION CONFIRMED! Starting transaction process...");
            
            // Initialize tracker and process verification
            const tracker = DAOContributionTracker.getInstance();
            tracker.initialize();
            const verifierUserId = client.getSafeUserId();
            
            // Process verification for the event
            await tracker.processVerificationForEvent(mxEvent, verifierUserId, roomId);
            
            // Send the reaction
            const reactionKey = "👍";
            const verificationData = {
                "m.relates_to": {
                    "rel_type": RelationType.Annotation as const,
                    "event_id": eventId,
                    "key": reactionKey,
                },
                "verification": true,
                "issued_at": Date.now(),
                "issuer": client.getSafeUserId(),
            };
            
            await client.sendEvent(roomId, EventType.Reaction, verificationData);
            console.log("✅ Verification reaction sent successfully");
            
            onFinished(true);
        } catch (error) {
            console.error("Failed to process verification:", error);
            onFinished(false);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = () => {
        onFinished(false);
    };

    return (
        <BaseDialog
            title={_t("Check Public Key")}
            onFinished={handleCancel}
            className="mx_CheckPublicKeyDialog"
        >
            <div className="mx_Dialog_content">
                <div className="mx_CheckPublicKeyDialog_content">
                    <p>{_t("The following public key was embedded in this message:")}</p>
                    
                    <div className="mx_CheckPublicKeyDialog_publicKey">
                        <code>{publicKey || _t("No public key found")}</code>
                    </div>
                    
                    <p className="mx_CheckPublicKeyDialog_warning">
                        {_t("Please verify this public key before giving Kudos. This action cannot be undone.")}
                    </p>
                </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '12px', marginTop: '16px' }}>
                <button
                    onClick={handleCancel}
                    disabled={isProcessing}
                    style={{
                        padding: '8px 16px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        backgroundColor: '#f5f5f5',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    {_t("Cancel")}
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        opacity: isProcessing ? 0.6 : 1
                    }}
                >
                    {isProcessing ? _t("Processing...") : _t("Confirm Kudos")}
                </button>
            </div>
        </BaseDialog>
    );
};
