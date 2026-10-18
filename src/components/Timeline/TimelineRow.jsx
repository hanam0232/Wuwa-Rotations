import React, { useState, useRef, useEffect } from "react";
import { Menu, Copy, Trash2, Ban } from "lucide-react";
import { ATTRIBUTE_COLORS } from "../../data/constants";
import { globalDragState } from "../Sidebar/Sidebar";

export default function TimelineRow({
    row,
    rowIndex,
    isBeingDragged,
    isDropTarget,
    animStyle,
    isAnimating,
    onRowDragStart,
    onRowDragOver,
    onRowDragLeave,
    onRowDrop,
    onRowDragEnd,
    onDropChar,
    onDropSkill,
    onReorderSkill,
    onDeleteRow,
    onDuplicateRow,
    onDeleteSkill,
}) {
    const [draggedActionIdx, setDraggedActionIdx] = useState(null);
    const [hoverActionIdx, setHoverActionIdx] = useState(null);

    // State cho khối bay theo chuột và trạng thái cấm
    const [floatingBadge, setFloatingBadge] = useState(null); // { label, bgColor, textColor, x, y, isForbidden }

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const showTimeoutRef = useRef(null);

    const handleMouseEnterMenuArea = () => {
        if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = setTimeout(() => {
            setIsMenuOpen(true);
        }, 20);
    };

    const handleMouseLeaveMenuArea = () => {
        if (showTimeoutRef.current) {
            clearTimeout(showTimeoutRef.current);
            showTimeoutRef.current = null;
        }
        setIsMenuOpen(false);
    };

    useEffect(() => {
        return () => {
            if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
        };
    }, []);

    const charAttributeColor = row.character
        ? ATTRIBUTE_COLORS[row.character.attribute] || "#6b7280"
        : "transparent";

    const hasCharacter = !!row.character;

    const handleDragOverActions = (e) => {
        if (!hasCharacter) return;
        if (draggedActionIdx === null && !globalDragState.activeSkill) return;

        e.preventDefault();

        const container = e.currentTarget;
        const rectTrack = container.getBoundingClientRect();
        const mouseY = e.clientY;

        if (mouseY < rectTrack.top - 35 || mouseY > rectTrack.bottom + 35) {
            setHoverActionIdx(null);
            return;
        }

        const items = Array.from(
            container.querySelectorAll(
                ".timeline-action-badge:not(.is-dragging-placeholder):not(.is-external-placeholder)",
            ),
        );
        const mouseX = e.clientX;

        if (items.length === 0) {
            setHoverActionIdx(0);
            return;
        }

        const lastRect = items[items.length - 1].getBoundingClientRect();
        if (mouseX > lastRect.left + lastRect.width / 2) {
            setHoverActionIdx(row.actions.length);
            return;
        }

        let targetIdx = 0;
        for (let i = 0; i < items.length; i++) {
            const rect = items[i].getBoundingClientRect();
            const midPoint = rect.left + rect.width / 2;
            if (mouseX < midPoint) {
                targetIdx = i;
                break;
            }
        }
        setHoverActionIdx(targetIdx);
    };

    const handleDropActions = (e) => {
        if (!hasCharacter) return;
        e.preventDefault();

        const type = e.dataTransfer.getData("type");
        const sourceRowIdx = e.dataTransfer.getData("sourceRowIndex");
        const sourceActionIdx = e.dataTransfer.getData("sourceActionIndex");

        if (type === "skill") {
            const skill = JSON.parse(e.dataTransfer.getData("data"));
            onDropSkill(rowIndex, skill, hoverActionIdx);
        } else if (type === "placed-skill") {
            if (parseInt(sourceRowIdx, 10) === rowIndex) {
                onReorderSkill(
                    rowIndex,
                    parseInt(sourceActionIdx, 10),
                    hoverActionIdx,
                );
            }
        }

        setHoverActionIdx(null);
        setDraggedActionIdx(null);
        setFloatingBadge(null);
        globalDragState.activeSkill = null;
        globalDragState.dragWidth = 0;
    };

    const startSkillDrag = (e, act, actIdx) => {
        e.stopPropagation();
        e.dataTransfer.setData("type", "placed-skill");
        e.dataTransfer.setData("sourceRowIndex", rowIndex.toString());
        e.dataTransfer.setData("sourceActionIndex", actIdx.toString());

        // Ẩn ảnh kéo ghost mặc định của trình duyệt bằng pixel trong suốt
        const transparentImg = new Image();
        transparentImg.src =
            "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        e.dataTransfer.setDragImage(transparentImg, 0, 0);

        setTimeout(() => setDraggedActionIdx(actIdx), 0);

        setFloatingBadge({
            label: act.label,
            bgColor: act.backgroundColor,
            textColor: act.textColor,
            x: e.clientX,
            y: e.clientY,
            isForbidden: false,
        });

        const handleDragOverWindow = (dragEvent) => {
            if (dragEvent.clientX === 0 && dragEvent.clientY === 0) return;

            const target = document.elementFromPoint(
                dragEvent.clientX,
                dragEvent.clientY,
            );
            const validTrack =
                target &&
                target.closest(
                    `.timeline-row:nth-child(${rowIndex + 1}) .col-actions-track`,
                );

            setFloatingBadge((prev) =>
                prev
                    ? {
                          ...prev,
                          x: dragEvent.clientX,
                          y: dragEvent.clientY,
                          isForbidden: !validTrack,
                      }
                    : null,
            );
        };

        const handleDragEndWindow = () => {
            setFloatingBadge(null);
            setDraggedActionIdx(null);
            setHoverActionIdx(null);
            window.removeEventListener("dragover", handleDragOverWindow);
        };

        window.addEventListener("dragover", handleDragOverWindow);
        window.addEventListener("dragend", handleDragEndWindow, { once: true });
    };

    const renderActionBadges = () => {
        if (draggedActionIdx !== null) {
            const items = row.actions.map((act, idx) => ({
                ...act,
                originalIdx: idx,
            }));

            if (hoverActionIdx !== null) {
                const [moved] = items.splice(draggedActionIdx, 1);
                const destIdx =
                    hoverActionIdx > draggedActionIdx
                        ? hoverActionIdx - 1
                        : hoverActionIdx;
                items.splice(destIdx, 0, moved);
            }

            return items.map((act) => {
                const isItemDragged = draggedActionIdx === act.originalIdx;
                return (
                    <div
                        key={act.instanceId}
                        className={`timeline-action-badge ${
                            isItemDragged ? "is-dragging-placeholder" : ""
                        }`}
                        draggable
                        onDragStart={(e) =>
                            startSkillDrag(e, act, act.originalIdx)
                        }
                        style={{
                            backgroundColor: act.backgroundColor,
                            color: act.textColor,
                        }}
                    >
                        {act.label}
                    </div>
                );
            });
        }

        const elements = [];
        const actions = row.actions;
        const isSidebarDragging =
            !!globalDragState.activeSkill && hoverActionIdx !== null;
        const sidebarWidth = globalDragState.dragWidth || 48;

        actions.forEach((act, idx) => {
            if (isSidebarDragging && hoverActionIdx === idx) {
                elements.push(
                    <div
                        key="external-placeholder"
                        className="timeline-action-badge is-dragging-placeholder is-external-placeholder"
                        style={{ width: `${sidebarWidth}px` }}
                    />,
                );
            }

            elements.push(
                <div
                    key={act.instanceId}
                    className="timeline-action-badge"
                    draggable
                    onDoubleClick={() => onDeleteSkill(rowIndex, idx)}
                    onDragStart={(e) => startSkillDrag(e, act, idx)}
                    style={{
                        backgroundColor: act.backgroundColor,
                        color: act.textColor,
                    }}
                >
                    {act.label}
                </div>,
            );
        });

        if (isSidebarDragging && hoverActionIdx >= actions.length) {
            elements.push(
                <div
                    key="external-placeholder-end"
                    className="timeline-action-badge is-dragging-placeholder is-external-placeholder"
                    style={{ width: `${sidebarWidth}px` }}
                />,
            );
        }

        return elements;
    };

    return (
        <>
            <div
                className={`timeline-row ${isBeingDragged ? "row-dragging" : ""} ${isDropTarget ? "row-drop-target" : ""}`}
                style={{
                    transform: animStyle.transform || "translate3d(0, 0, 0)",
                    transition: animStyle.transition || "none",
                    zIndex: animStyle.zIndex || (isBeingDragged ? 40 : "auto"),
                }}
                draggable={!isAnimating}
                onDragStart={(e) => onRowDragStart(e, rowIndex)}
                onDragOver={(e) => onRowDragOver(e, rowIndex)}
                onDragLeave={(e) => onRowDragLeave(e, rowIndex)}
                onDrop={(e) => onRowDrop(e, rowIndex)}
                onDragEnd={onRowDragEnd}
            >
                <div
                    className="attribute-strip"
                    style={{ backgroundColor: charAttributeColor }}
                />

                <div className="row-col col-index">{rowIndex + 1}</div>

                <div
                    className="row-col col-character-info"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => onDropChar(e, rowIndex)}
                >
                    {row.character ? (
                        <>
                            <div className="char-avatar-square gray-border">
                                <img
                                    src={row.character.avatar}
                                    alt={row.character.name}
                                />
                            </div>
                            <span className="char-name-label">
                                {row.character.name}
                            </span>
                        </>
                    ) : (
                        <span className="drop-char-hint">
                            + Kéo Char vào đây
                        </span>
                    )}
                </div>

                <div
                    className={`row-col col-actions-track ${!hasCharacter ? "disabled-track" : ""}`}
                    onDragOver={handleDragOverActions}
                    onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                            setHoverActionIdx(null);
                        }
                    }}
                    onDrop={handleDropActions}
                >
                    {!hasCharacter ? (
                        <span className="locked-text">
                            Cần kéo nhân vật vào trước khi thêm chiêu
                        </span>
                    ) : (
                        renderActionBadges()
                    )}
                </div>

                <div
                    className="row-col col-row-menu"
                    onMouseEnter={handleMouseEnterMenuArea}
                    onMouseLeave={handleMouseLeaveMenuArea}
                >
                    <button
                        className={`btn-row-menu-trigger ${isMenuOpen ? "active" : ""}`}
                        title="Tùy chọn dòng"
                    >
                        <Menu size={16} />
                    </button>

                    {isMenuOpen && (
                        <div
                            className="row-action-popover"
                            onMouseEnter={handleMouseEnterMenuArea}
                            onMouseLeave={handleMouseLeaveMenuArea}
                        >
                            <button
                                className="row-popover-item"
                                onClick={() => {
                                    onDuplicateRow(rowIndex);
                                    setIsMenuOpen(false);
                                }}
                            >
                                <Copy size={14} />
                                <span>Nhân bản dòng</span>
                            </button>

                            <button
                                className="row-popover-item delete-item"
                                onClick={() => {
                                    onDeleteRow(rowIndex);
                                    setIsMenuOpen(false);
                                }}
                            >
                                <Trash2 size={14} />
                                <span>Xóa dòng</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Khối badge tùy chỉnh bám theo trỏ chuột */}
            {floatingBadge && (
                <div
                    className={`custom-drag-floating-badge ${
                        floatingBadge.isForbidden ? "is-forbidden" : ""
                    }`}
                    style={{
                        left: `${floatingBadge.x}px`,
                        top: `${floatingBadge.y}px`,
                        backgroundColor: floatingBadge.bgColor,
                        color: floatingBadge.textColor,
                    }}
                >
                    {floatingBadge.label}
                    {floatingBadge.isForbidden && (
                        <div className="forbidden-cursor-icon">
                            <Ban size={15} color="#ef4444" strokeWidth={3} />
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
