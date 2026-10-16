import { useState, useEffect } from "react";
import { getSavedPresets, deletePresetFromList } from "../../utils/storage";
import { CHARACTERS_DATABASE } from "../../data/constants";
import "./ProfileModal.css";

export default function ProfileModal({
    isOpen,
    onClose,
    onLoadPreset,
    onRequestConfirmation,
}) {
    const [presets, setPresets] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setPresets(getSavedPresets());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleDelete = (id, e) => {
        e.stopPropagation();
        onRequestConfirmation(
            "Xóa Preset",
            "Bạn có chắc muốn xóa Preset này?",
            () => {
                deletePresetFromList(id);
                setPresets(getSavedPresets());
            },
        );
    };

    return (
        <div className="profile-overlay" onClick={onClose}>
            <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
                <div className="profile-header">
                    <h3>Saved Rotations</h3>
                    <button className="profile-btn-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="profile-body">
                    {presets.length === 0 ? (
                        <div className="profile-empty">
                            Chưa có Rotation Preset nào được lưu.
                        </div>
                    ) : (
                        <div className="profile-list">
                            {presets.map((p) => (
                                <div
                                    key={p.id}
                                    className="profile-item"
                                    onClick={() => {
                                        onLoadPreset(p);
                                        onClose();
                                    }}
                                >
                                    <div className="profile-item-info">
                                        <span className="profile-item-name">
                                            {p.name}
                                        </span>
                                        <span className="profile-item-date">
                                            {new Date(
                                                p.updatedAt,
                                            ).toLocaleString()}
                                        </span>
                                    </div>

                                    <div className="profile-item-team">
                                        {(p.team || []).map((charId, idx) => {
                                            const char =
                                                CHARACTERS_DATABASE.find(
                                                    (c) => c.id === charId,
                                                );
                                            return char ? (
                                                <img
                                                    key={idx}
                                                    src={char.avatar}
                                                    alt={char.name}
                                                    className="profile-char-thumb"
                                                />
                                            ) : (
                                                <div
                                                    key={idx}
                                                    className="profile-char-thumb empty-thumb"
                                                />
                                            );
                                        })}
                                    </div>

                                    <button
                                        className="profile-btn-del"
                                        onClick={(e) => handleDelete(p.id, e)}
                                        title="Xóa preset này"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
