import { toPng } from "html-to-image";

export const exportPresetToJson = (presetData) => {
    const fileName = `${presetData.name || "rotation"}.json`;
    const jsonStr = JSON.stringify(presetData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
};

export const importPresetFromJson = (onSuccess, onError) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";

    input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (onSuccess) onSuccess(parsed);
            } catch (err) {
                console.error("Lỗi khi đọc file JSON:", err);
                if (onError) onError(err);
            }
        };
        reader.readAsText(file);
    };

    input.click();
};

// Tạo dataUrl ảnh PNG để xem trước
export const generateTimelineImage = async (elementId) => {
    const node = document.getElementById(elementId);
    if (!node) return null;

    try {
        const rows = Array.from(node.querySelectorAll(".timeline-row")).filter(
            (row) => !row.querySelector(".drop-char-hint"),
        );

        if (rows.length === 0) return null;

        let maxRight = 0;
        const nodeRect = node.getBoundingClientRect();

        rows.forEach((row) => {
            const badges = row.querySelectorAll(".timeline-action-badge");
            if (badges.length > 0) {
                const lastBadge = badges[badges.length - 1];
                const badgeRect = lastBadge.getBoundingClientRect();
                const relativeRight = badgeRect.right - nodeRect.left;
                if (relativeRight > maxRight) maxRight = relativeRight;
            } else {
                const charCol = row.querySelector(".col-character-info");
                if (charCol) {
                    const charRect = charCol.getBoundingClientRect();
                    const relativeRight = charRect.right - nodeRect.left;
                    if (relativeRight > maxRight) maxRight = relativeRight;
                }
            }
        });

        let totalHeight = 0;
        rows.forEach((row) => {
            totalHeight += row.offsetHeight;
        });

        const targetWidth = Math.ceil(maxRight + 20);
        const targetHeight = Math.ceil(totalHeight);

        return await toPng(node, {
            backgroundColor: "#0b0e14",
            pixelRatio: 2,
            width: targetWidth,
            height: targetHeight,
            style: {
                width: `${targetWidth}px`,
                height: `${targetHeight}px`,
                maxWidth: "none",
                overflow: "hidden",
            },
            filter: (domNode) => {
                if (!domNode.classList) return true;
                if (
                    domNode.classList.contains("col-delete-row") ||
                    domNode.classList.contains("create-row-dropzone") ||
                    domNode.classList.contains("drop-char-hint")
                ) {
                    return false;
                }
                if (
                    domNode.classList.contains("timeline-row") &&
                    domNode.getElementsByClassName("drop-char-hint").length > 0
                ) {
                    return false;
                }
                return true;
            },
        });
    } catch (err) {
        console.error("Lỗi khi render ảnh:", err);
        return null;
    }
};

// Tải ảnh về máy
export const downloadImage = (dataUrl, fileName = "rotation.png") => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = fileName.endsWith(".png") ? fileName : `${fileName}.png`;
    a.click();
};
