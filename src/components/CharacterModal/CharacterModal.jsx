import { useState } from "react";
import {
    ATTRIBUTES,
    CHARACTERS_DATABASE,
    ATTRIBUTE_COLORS,
} from "../../data/constants";
import "./CharacterModal.css";

export default function CharacterModal({
    isOpen,
    onClose,
    onRequestConfirmation,
    currentTeam,
    onSaveTeam,
}) {
    if (!isOpen) return null;

    const [tempTeam, setTempTeam] = useState([...currentTeam]);
    const [selectedAttr, setSelectedAttr] = useState(ATTRIBUTES[0].id);

    const handleToggleChar = (char) => {
        const existsIdx = tempTeam.findIndex((c) => c && c.id === char.id);
        if (existsIdx !== -1) {
            const next = [...tempTeam];
            next[existsIdx] = null;
            setTempTeam(next);
            return;
        }
        const emptyIdx = tempTeam.findIndex((c) => c === null);
        if (emptyIdx !== -1) {
            const next = [...tempTeam];
            next[emptyIdx] = char;
            setTempTeam(next);
        }
    };

    const filteredChars = CHARACTERS_DATABASE.filter(
        (c) => c.attribute === selectedAttr,
    );

    const fiveStarChars = filteredChars.filter((c) => c.rarity === 5);
    const fourStarChars = filteredChars.filter((c) => c.rarity === 4);

    const handleRequestClose = () => {
        onRequestConfirmation(
            "Đóng chọn nhân vật",
            "Bạn có chắc muốn đóng cửa sổ chọn nhân vật không? Các thay đổi chưa lưu sẽ bị mất.",
            onClose,
        );
    };

    const renderCharItem = (char) => {
        const isSelected = tempTeam.some((c) => c && c.id === char.id);
        const attrColor = ATTRIBUTE_COLORS[char.attribute] || "#eab308";
        const rarityClass = char.rarity === 5 ? "rarity-5" : "rarity-4";

        return (
            <div
                key={char.id}
                className={`char-list-row ${isSelected ? "selected" : ""}`}
                style={isSelected ? { borderColor: attrColor } : {}}
                onClick={() => handleToggleChar(char)}
            >
                <div className={`char-avatar-box ${rarityClass}`}>
                    <img src={char.avatar} alt={char.name} />
                </div>

                <span className="char-name">{char.name}</span>

                <span className="char-attr-txt" style={{ color: attrColor }}>
                    {char.attribute}
                </span>
            </div>
        );
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-dialog">
                <div className="modal-header">
                    <h3>Chọn nhân vật</h3>
                    <button className="btn-close" onClick={handleRequestClose}>
                        ×
                    </button>
                </div>

                <div className="modal-top-slots">
                    {tempTeam.map((char, idx) => {
                        const attrColor = char
                            ? ATTRIBUTE_COLORS[char.attribute]
                            : "transparent";
                        return (
                            <div
                                key={idx}
                                className={`modal-slot ${char ? "has-char" : "empty"}`}
                                style={char ? { borderColor: attrColor } : {}}
                                onClick={() => {
                                    if (char) {
                                        const next = [...tempTeam];
                                        next[idx] = null;
                                        setTempTeam(next);
                                    }
                                }}
                            >
                                {char ? (
                                    <img src={char.avatar} alt={char.name} />
                                ) : (
                                    <span>+</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="modal-attributes-bar">
                    {ATTRIBUTES.map((attr) => (
                        <button
                            key={attr.id}
                            className={`attr-tab-icon ${selectedAttr === attr.id ? "active" : ""}`}
                            onClick={() => setSelectedAttr(attr.id)}
                            title={attr.name}
                        >
                            <img
                                src={attr.icon}
                                alt={attr.name}
                                className="attr-icon-img"
                            />
                        </button>
                    ))}
                </div>

                <div className="modal-char-list">
                    {fiveStarChars.length > 0 && (
                        <div className="char-rarity-group">
                            <div className="char-group-title">5★</div>
                            <div className="char-group-items">
                                {fiveStarChars.map(renderCharItem)}
                            </div>
                        </div>
                    )}

                    {fourStarChars.length > 0 && (
                        <div className="char-rarity-group">
                            <div className="char-group-title">4★</div>
                            <div className="char-group-items">
                                {fourStarChars.map(renderCharItem)}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        className="btn btn-save"
                        onClick={() => onSaveTeam(tempTeam)}
                    >
                        Lưu
                    </button>
                </div>
            </div>
        </div>
    );
}
