import TimelineRow from "./TimelineRow";
import "./Timeline.css";

export default function TimelineSheet({
    rows,
    onDropCharOnRow,
    onDropSkillOnRow,
    onReorderSkillOnRow,
    onDropCreateNewRow,
    onDeleteRow,
    onDeleteSkill,
}) {
    return (
        <main className="timeline-sheet-wrapper">
            <div className="timeline-table" id="timeline-export-capture">
                {rows &&
                    rows.map((row, index) => (
                        <TimelineRow
                            key={row.id}
                            row={row}
                            rowIndex={index}
                            onDropChar={onDropCharOnRow}
                            onDropSkill={onDropSkillOnRow}
                            onReorderSkill={onReorderSkillOnRow}
                            onDeleteRow={onDeleteRow}
                            onDeleteSkill={onDeleteSkill}
                        />
                    ))}

                <div
                    className="create-row-dropzone"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDropCreateNewRow}
                >
                    + Thả nhân vật vào đây để tạo hàng mới
                </div>
            </div>
        </main>
    );
}
