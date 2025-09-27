/*
Copyright 2024 New Vector Ltd.

SPDX-License-Identifier: AGPL-3.0-only OR GPL-3.0-only OR LicenseRef-Element-Commercial
Please see LICENSE files in the repository root for full details.
*/

import React, { useState, useEffect } from "react";
import { type Room } from "matrix-js-sdk/src/matrix";
import { logger } from "matrix-js-sdk/src/logger";

import { _t } from "../../../../../languageHandler";
import LabelledToggleSwitch from "../../../elements/LabelledToggleSwitch";
import { findDCASpace, getDCASettings, setDCASettings, type DCASettings } from "../../../../../utils/DCASettings";
import { MatrixClientPeg } from "../../../../../MatrixClientPeg";

interface IProps {
    room: Room;
}

const DCARoomSettingsTab: React.FC<IProps> = ({ room }) => {
    const [dcaSettings, setDcaSettings] = useState<DCASettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // DCA 스페이스 찾기
    const dcaSpace = findDCASpace(room);

    useEffect(() => {
        if (dcaSpace) {
            const settings = getDCASettings(dcaSpace);
            setDcaSettings(settings);
        }
        setLoading(false);
    }, [dcaSpace]);

    const handleSelfVerificationToggle = async (enabled: boolean): Promise<void> => {
        if (!dcaSpace || !dcaSettings) return;

        setSaving(true);
        try {
            const newSettings: DCASettings = {
                ...dcaSettings,
                allowSelfVerification: enabled,
            };

            const success = await setDCASettings(dcaSpace, newSettings);
            if (success) {
                setDcaSettings(newSettings);
                logger.info("DCA self verification setting updated successfully");
            } else {
                logger.error("Failed to update DCA self verification setting");
            }
        } catch (error) {
            logger.error("Error updating DCA self verification setting:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="mx_SettingsTab mx_DCARoomSettingsTab">
                <div className="mx_SettingsTab_heading">{_t("DCA Settings")}</div>
                <div className="mx_SettingsTab_section">
                    <div className="mx_SettingsTab_section_heading">{_t("Loading...")}</div>
                </div>
            </div>
        );
    }

    if (!dcaSpace) {
        return (
            <div className="mx_SettingsTab mx_DCARoomSettingsTab">
                <div className="mx_SettingsTab_heading">{_t("DCA Settings")}</div>
                <div className="mx_SettingsTab_section">
                    <div className="mx_SettingsTab_section_heading">{_t("Not a DCA Room")}</div>
                    <div className="mx_SettingsTab_section_content">
                        <p>{_t("This room is not part of a DCA space, so DCA settings are not available.")}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx_SettingsTab mx_DCARoomSettingsTab">
            <div className="mx_SettingsTab_heading">{_t("DCA Settings")}</div>
            
            <div className="mx_SettingsTab_section">
                <div className="mx_SettingsTab_section_heading">{_t("Verification Settings")}</div>
                <div className="mx_SettingsTab_section_content">
                    <LabelledToggleSwitch
                        label={_t("Allow self verification")}
                        description={_t("Allow verifiers to give kudos to their own messages in DCA rooms")}
                        value={dcaSettings?.allowSelfVerification ?? true}
                        onChange={handleSelfVerificationToggle}
                        disabled={saving}
                    />
                </div>
            </div>

            <div className="mx_SettingsTab_section">
                <div className="mx_SettingsTab_section_heading">{_t("About DCA Settings")}</div>
                <div className="mx_SettingsTab_section_content">
                    <p>
                        {_t("DCA (Development through Contribution Activities) settings control how verification works in DCA spaces.")}
                    </p>
                    <p>
                        {_t("When self verification is enabled, users with verification authority can give kudos to their own messages. When disabled, they can only verify other users' messages.")}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DCARoomSettingsTab;
