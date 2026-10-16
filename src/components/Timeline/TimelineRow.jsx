import React, { useState } from "react";
import { ATTRIBUTE_COLORS } from "../../data/constants";
import { globalDragState } from "../Sidebar/Sidebar";

export default function TimelineRow({
    row,
    rowIndex,
    onDropChar,
    onDropSkill,
    onReorderSkill,
    onDeleteRow,
    onDeleteSkill,
}) {
    const [draggedActionIdx, setDraggedActionIdx] = useState(null);
    const [hoverActionIdx, setHoverActionIdx] = useState(null);

    const charAttributeColor = row.character
        ? ATTRIBUTE_COLORS[row.character.attribute] || "#6b7280"
        : "transparent";

    const hasCharacter = !!row.character;

    const handleDragOverActions = (e) => {
        if (!hasCharacter) return;
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

        // Nếu rê chuột qua nửa sau của khối cuối hoặc khoảng trống bên phải -> đích là sau cùng
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
        const sourceIdx = e.dataTransfer.getData("sourceActionIndex");

        if (type === "skill") {
            const skill = JSON.parse(e.dataTransfer.getData("data"));
            onDropSkill(rowIndex, skill, hoverActionIdx);
        } else if (type === "placed-skill") {
            onReorderSkill(rowIndex, parseInt(sourceIdx, 10), hoverActionIdx);
        }

        setHoverActionIdx(null);
        setDraggedActionIdx(null);
        globalDragState.activeSkill = null;
        globalDragState.dragWidth = 0;
    };

    const renderActionBadges = () => {
        // 1. Trường hợp kéo khối nội bộ trong hàng
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
                const isBeingDragged = draggedActionIdx === act.originalIdx;
                return (
                    <div
                        key={act.instanceId}
                        className={`timeline-action-badge ${isBeingDragged ? "is-dragging-placeholder" : ""}`}
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer.setData("type", "placed-skill");
                            e.dataTransfer.setData(
                                "sourceRowIndex",
                                rowIndex.toString(),
                            );
                            e.dataTransfer.setData(
                                "sourceActionIndex",
                                act.originalIdx.toString(),
                            );
                            setTimeout(
                                () => setDraggedActionIdx(act.originalIdx),
                                0,
                            );
                        }}
                        onDragEnd={() => {
                            setDraggedActionIdx(null);
                            setHoverActionIdx(null);
                        }}
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

        // 2. Trường hợp kéo từ Sidebar vào
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
                    onDragStart={(e) => {
                        e.dataTransfer.setData("type", "placed-skill");
                        e.dataTransfer.setData(
                            "sourceRowIndex",
                            rowIndex.toString(),
                        );
                        e.dataTransfer.setData(
                            "sourceActionIndex",
                            idx.toString(),
                        );
                        setTimeout(() => setDraggedActionIdx(idx), 0);
                    }}
                    onDragEnd={() => {
                        setDraggedActionIdx(null);
                        setHoverActionIdx(null);
                    }}
                    style={{
                        backgroundColor: act.backgroundColor,
                        color: act.textColor,
                    }}
                >
                    {act.label}
                </div>,
            );
        });

        // Thả vào vị trí sau cùng của hàng
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
        <div className="timeline-row">
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
                    <span className="drop-char-hint">+ Kéo Char vào đây</span>
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

            <div className="row-col col-delete-row">
                <button
                    className="btn-delete-row"
                    title="Xóa hàng này"
                    onClick={() => onDeleteRow(rowIndex)}
                >
                    ×
                </button>
            </div>
        </div>
    );
}
