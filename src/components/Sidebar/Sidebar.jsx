import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { HexColorPicker } from "react-colorful";
import { RotateCcw } from "lucide-react";
import { ATTRIBUTE_COLORS, BASIC_MOVES } from "../../data/constants";
import {
    getStoredMoves,
    saveStoredMoves,
    resetStoredMoves,
} from "../../utils/storage";
import "./Sidebar.css";

const PRESET_COLORS = [
    "#a855f7",
    "#701a75",
    "#2563eb",
    "#328306",
    "#d97706",
    "#dc2626",
    "#be185d",
    "#3e4856",
];

export const globalDragState = {
    activeSkill: null,
    dragWidth: 0,
};

export default function Sidebar({
    selectedTeam,
    onOpenModal,
    onDeletePlacedSkill,
    onRequestConfirmation,
}) {
    const [moves, setMoves] = useState(() => getStoredMoves());
    const [isAdding, setIsAdding] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
    const [popoverCoords, setPopoverCoords] = useState({ bottom: 0, left: 0 });

    const inputRef = useRef(null);
    const popoverRef = useRef(null);

    const updatePopoverPosition = () => {
        if (!inputRef.current) return;
        const rect = inputRef.current.getBoundingClientRect();
        setPopoverCoords({
            left: rect.right + 12,
            bottom: window.innerHeight - rect.bottom,
        });
    };

    useEffect(() => {
        if (isAdding) {
            if (inputRef.current) inputRef.current.focus();
            updatePopoverPosition();
            window.addEventListener("scroll", updatePopoverPosition, true);
            window.addEventListener("resize", updatePopoverPosition);
        }
        return () => {
            window.removeEventListener("scroll", updatePopoverPosition, true);
            window.removeEventListener("resize", updatePopoverPosition);
        };
    }, [isAdding]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!isAdding) return;
            const clickedInsideInput =
                inputRef.current && inputRef.current.contains(event.target);
            const clickedInsidePopover =
                popoverRef.current && popoverRef.current.contains(event.target);

            if (!clickedInsideInput && !clickedInsidePopover) {
                handleCommitMove();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [isAdding, inputValue, selectedColor]);

    const handleDragStartChar = (e, char) => {
        e.dataTransfer.setData("type", "character");
        e.dataTransfer.setData("data", JSON.stringify(char));
    };

    const handleDragStartSkill = (e, move) => {
        const width = e.currentTarget.offsetWidth;
        globalDragState.activeSkill = move;
        globalDragState.dragWidth = width;

        e.dataTransfer.setData("type", "skill");
        e.dataTransfer.setData("data", JSON.stringify(move));
    };

    const handleDragEndSkill = () => {
        globalDragState.activeSkill = null;
        globalDragState.dragWidth = 0;
    };

    const handleDropOnSidebar = (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData("type");
        if (type === "placed-skill") {
            const sourceRowIndex = parseInt(
                e.dataTransfer.getData("sourceRowIndex"),
                10,
            );
            const sourceActionIndex = parseInt(
                e.dataTransfer.getData("sourceActionIndex"),
                10,
            );
            onDeletePlacedSkill(sourceRowIndex, sourceActionIndex);
        }
    };

    const handleCommitMove = () => {
        const trimmed = inputValue.trim();
        if (trimmed) {
            const newMove = {
                id: trimmed,
                bgColor: selectedColor,
                textColor: "#ffffff",
                isCustom: true,
            };
            const nextMoves = [...moves, newMove];
            setMoves(nextMoves);
            saveStoredMoves(nextMoves);
        }
        setInputValue("");
        setSelectedColor(PRESET_COLORS[0]);
        setIsAdding(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleCommitMove();
        else if (e.key === "Escape") {
            setInputValue("");
            setIsAdding(false);
        }
    };

    // Xóa theo index để không bị xóa trùng các chiêu cùng tên (như "E", "BA")
    const handleDeleteMoveByIndex = (indexToDelete) => {
        const nextMoves = moves.filter((_, idx) => idx !== indexToDelete);
        setMoves(nextMoves);
        saveStoredMoves(nextMoves);
    };

    // Reset về danh sách ban đầu trong constants.js
    const handleResetMoves = () => {
        onRequestConfirmation(
            "Đặt lại danh sách chiêu",
            "Bạn có muốn đặt lại danh sách chiêu về mặc định ban đầu không?",
            () => {
                resetStoredMoves();
                setMoves(BASIC_MOVES);
            },
        );
    };

    return (
        <aside
            className="sidebar"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropOnSidebar}
        >
            <div className="section-char-team">
                <div className="sidebar-slots">
                    {selectedTeam.map((char, index) => {
                        const attrColor = char
                            ? ATTRIBUTE_COLORS[char.attribute] || "#4b5563"
                            : "#3b4252";
                        return (
                            <div
                                key={index}
                                className={`char-box-slot ${char ? "has-char" : "empty"}`}
                                draggable={!!char}
                                onDragStart={(e) =>
                                    char && handleDragStartChar(e, char)
                                }
                                style={{ borderColor: attrColor }}
                            >
                                {char ? (
                                    <img
                                        src={char.avatar}
                                        alt={char.name}
                                        className="char-box-avatar"
                                    />
                                ) : (
                                    <span className="plus-sign">+</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                <button className="btn-select-popup" onClick={onOpenModal}>
                    Select Character
                </button>
            </div>

            <hr className="divider" />

            <div className="section-basic-moves">
                <div className="section-header-row">
                    <span className="section-title">BASIC MOVES</span>
                    <button
                        className="btn-reset-moves"
                        onClick={handleResetMoves}
                        title="Đặt lại danh sách chiêu thức về mặc định"
                    >
                        <RotateCcw size={12} />
                        <span>Reset</span>
                    </button>
                </div>

                <div className="moves-grid">
                    {moves.map((move, index) => (
                        <div
                            key={`${move.id}-${index}`}
                            className="move-badge-wrapper"
                        >
                            <div
                                className="move-badge"
                                draggable
                                onDragStart={(e) =>
                                    handleDragStartSkill(e, move)
                                }
                                onDragEnd={handleDragEndSkill}
                                style={{
                                    backgroundColor: move.bgColor,
                                    color: move.textColor,
                                }}
                            >
                                {move.id}
                            </div>
                            <button
                                className="btn-delete-custom-move"
                                onClick={() => handleDeleteMoveByIndex(index)}
                                title={`Xóa chiêu ${move.id}`}
                            >
                                ×
                            </button>
                        </div>
                    ))}

                    {isAdding ? (
                        <div className="creating-container">
                            <input
                                ref={inputRef}
                                type="text"
                                className="move-input-creating"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                style={{
                                    backgroundColor: selectedColor,
                                    width: `${Math.max(52, (inputValue.length + 1) * 11 + 20)}px`,
                                }}
                                placeholder="..."
                            />

                            {createPortal(
                                <div
                                    className="palette-portal-popup"
                                    ref={popoverRef}
                                    style={{
                                        left: `${popoverCoords.left}px`,
                                        bottom: `${popoverCoords.bottom}px`,
                                    }}
                                >
                                    <div className="preset-dots-row">
                                        {PRESET_COLORS.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                className={`palette-dot ${selectedColor.toLowerCase() === c.toLowerCase() ? "active" : ""}`}
                                                style={{ backgroundColor: c }}
                                                onClick={() =>
                                                    setSelectedColor(c)
                                                }
                                            />
                                        ))}
                                    </div>

                                    <div className="palette-divider" />

                                    <div className="custom-color-picker-box">
                                        <div className="picker-header">
                                            <span
                                                className="color-preview-circle"
                                                style={{
                                                    backgroundColor:
                                                        selectedColor,
                                                }}
                                            />
                                            <span className="color-hex-text">
                                                {selectedColor}
                                            </span>
                                        </div>
                                        <HexColorPicker
                                            color={selectedColor}
                                            onChange={setSelectedColor}
                                        />
                                    </div>
                                </div>,
                                document.body,
                            )}
                        </div>
                    ) : (
                        <div
                            className="move-badge add-move-btn"
                            onClick={() => setIsAdding(true)}
                            title="Thêm chiêu mới"
                        >
                            +
                        </div>
                    )}
                </div>
            </div>

            <div className="sidebar-trash-hint">
                Kéo chiêu từ hàng thả vào đây để xóa
            </div>
        </aside>
    );
}
