import React, { useState, useRef } from "react";
import TimelineRow from "./TimelineRow";
import "./Timeline.css";

const ROW_HEIGHT = 60; // Khớp với chiều cao 60px của dòng
const STEP_DURATION = 100; // 2 giây cho mỗi bước di chuyển

export default function TimelineSheet({
    rows,
    onDropCharOnRow,
    onDropSkillOnRow,
    onReorderSkillOnRow,
    onDropCreateNewRow,
    onDeleteRow,
    onDuplicateRow,
    onReorderRow,
    onDeleteSkill,
}) {
    const [draggedRowIndex, setDraggedRowIndex] = useState(null);
    const [dropTargetIndex, setDropTargetIndex] = useState(null);
    const [rowAnimStyles, setRowAnimStyles] = useState({});
    const isAnimatingRef = useRef(false);

    const handleRowDragStart = (e, index) => {
        if (isAnimatingRef.current) {
            e.preventDefault();
            return;
        }
        if (
            e.target.closest(".timeline-action-badge") ||
            e.target.closest("button") ||
            e.target.closest(".row-action-popover")
        ) {
            e.preventDefault();
            return;
        }

        e.dataTransfer.setData("type", "timeline-row");
        e.dataTransfer.setData("sourceRowIndex", index.toString());
        setDraggedRowIndex(index);
    };

    const handleRowDragOver = (e, index) => {
        if (draggedRowIndex === null || isAnimatingRef.current) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dropTargetIndex !== index) {
            setDropTargetIndex(index);
        }
    };

    const handleRowDragLeave = (e, index) => {
        if (
            dropTargetIndex === index &&
            !e.currentTarget.contains(e.relatedTarget)
        ) {
            setDropTargetIndex(null);
        }
    };

    const handleRowDrop = (e, targetIndex) => {
        const type = e.dataTransfer.getData("type");

        if (type === "timeline-row") {
            e.preventDefault();
            e.stopPropagation();

            const sourceIndex = parseInt(
                e.dataTransfer.getData("sourceRowIndex"),
                10,
            );
            setDraggedRowIndex(null);
            setDropTargetIndex(null);

            if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

            isAnimatingRef.current = true;

            const isMovingDown = targetIndex > sourceIndex;
            const distanceSteps = Math.abs(targetIndex - sourceIndex);
            const totalDuration = distanceSteps * STEP_DURATION;
            const totalShiftY = (targetIndex - sourceIndex) * ROW_HEIGHT;

            requestAnimationFrame(() => {
                // 1. Khối nguồn di chuyển đều từ tốn theo trục Y
                setRowAnimStyles({
                    [sourceIndex]: {
                        transform: `translate3d(0, ${totalShiftY}px, 0)`,
                        transition: `transform ${totalDuration}ms linear`,
                        zIndex: 100,
                    },
                });

                // 2. Danh sách các khối cần hoán đổi trên lộ trình
                const affectedIndices = [];
                if (isMovingDown) {
                    for (let i = sourceIndex + 1; i <= targetIndex; i++) {
                        affectedIndices.push(i);
                    }
                } else {
                    for (let i = sourceIndex - 1; i >= targetIndex; i--) {
                        affectedIndices.push(i);
                    }
                }

                // 3. Kích hoạt từng khối nhường đường đúng lúc tâm 2 khối cắt nhau
                affectedIndices.forEach((idx, stepIndex) => {
                    const shiftY = isMovingDown ? -ROW_HEIGHT : ROW_HEIGHT;
                    const triggerDelay = (stepIndex + 0.5) * STEP_DURATION;

                    setTimeout(() => {
                        setRowAnimStyles((prev) => ({
                            ...prev,
                            [idx]: {
                                transform: `translate3d(0, ${shiftY}px, 0)`,
                                transition: `transform ${STEP_DURATION}ms linear`,
                                zIndex: 1,
                            },
                        }));
                    }, triggerDelay);
                });

                // 4. Kết thúc toàn bộ tiến trình: chốt dữ liệu và reset transform
                setTimeout(() => {
                    onReorderRow(sourceIndex, targetIndex);
                    setRowAnimStyles({});
                    isAnimatingRef.current = false;
                }, totalDuration + 100);
            });

            return;
        }

        if (type === "character") {
            onDropCharOnRow(e, targetIndex);
        }
    };

    const handleRowDragEnd = () => {
        setDraggedRowIndex(null);
        setDropTargetIndex(null);
    };

    return (
        <main className="timeline-sheet-wrapper">
            <div className="timeline-table" id="timeline-export-capture">
                {rows.map((row, index) => {
                    const isBeingDragged = draggedRowIndex === index;
                    const isDropTarget =
                        draggedRowIndex !== null &&
                        dropTargetIndex === index &&
                        draggedRowIndex !== index;
                    const animStyle = rowAnimStyles[index] || {};

                    return (
                        <TimelineRow
                            key={row.id}
                            row={row}
                            rowIndex={index}
                            isBeingDragged={isBeingDragged}
                            isDropTarget={isDropTarget}
                            animStyle={animStyle}
                            isAnimating={isAnimatingRef.current}
                            onRowDragStart={handleRowDragStart}
                            onRowDragOver={handleRowDragOver}
                            onRowDragLeave={handleRowDragLeave}
                            onRowDrop={handleRowDrop}
                            onRowDragEnd={handleRowDragEnd}
                            onDropChar={onDropCharOnRow}
                            onDropSkill={onDropSkillOnRow}
                            onReorderSkill={onReorderSkillOnRow}
                            onDeleteRow={onDeleteRow}
                            onDuplicateRow={onDuplicateRow}
                            onDeleteSkill={onDeleteSkill}
                        />
                    );
                })}

                <div
                    className="create-row-dropzone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDropCreateNewRow}
                >
                    <span className="drop-char-hint">
                        + Thả nhân vật vào đây để tạo hàng mới
                    </span>
                </div>
            </div>
        </main>
    );
}
