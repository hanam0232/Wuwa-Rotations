import React from "react";
import { X, Download } from "lucide-react";
import "./ExportPreviewModal.css";

export default function ExportPreviewModal({
    isOpen,
    imageUrl,
    fileName,
    onClose,
    onConfirmExport,
}) {
    if (!isOpen) return null;

    return (
        <div className="preview-modal-backdrop" onClick={onClose}>
            <div
                className="preview-modal-container"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="preview-modal-header">
                    <span className="preview-modal-title">
                        Xem trước hình ảnh rotation
                    </span>
                    <button className="preview-modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="preview-modal-body">
                    {imageUrl ? (
                        <div className="preview-image-scroll-wrapper">
                            <img
                                src={imageUrl}
                                alt="Preview Rotation"
                                className="preview-image"
                            />
                        </div>
                    ) : (
                        <div className="preview-empty">
                            Đang chuẩn bị ảnh...
                        </div>
                    )}
                </div>

                <div className="preview-modal-footer">
                    <button className="btn-preview-cancel" onClick={onClose}>
                        Hủy
                    </button>
                    <button
                        className="btn-preview-export"
                        onClick={onConfirmExport}
                        disabled={!imageUrl}
                    >
                        <Download size={15} />
                        <span>Export PNG</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
