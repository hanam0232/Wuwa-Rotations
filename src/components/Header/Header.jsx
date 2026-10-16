import React from "react";
import {
    Gamepad2,
    FileJson,
    FileUp,
    Image,
    Bookmark,
    User,
} from "lucide-react";
import "./Header.css";

export default function Header({
    rotationName,
    onSavePreset,
    onOpenProfile,
    onExportJson,
    onImportJson,
    onExportImage,
}) {
    return (
        <header className="app-header">
            {/* Cụm bên trái: Icon, Title, Profile */}
            <div className="header-left">
                <div className="brand-logo">
                    <Gamepad2 className="gamepad-icon" />
                </div>
                <span className="brand-title">Wuwa Rotations</span>

                <button
                    className="btn btn-profile"
                    onClick={onOpenProfile}
                    title="Mở thư viện preset đã lưu"
                >
                    <User size={15} />
                    <span>Profile</span>
                </button>
            </div>

            {/* Chính giữa: Tên Preset */}
            <div className="header-center">
                <span
                    className="current-preset-badge"
                    title="Tên Rotation hiện tại"
                >
                    {rotationName || "Chưa đặt tên"}
                </span>
            </div>

            {/* Cụm bên phải: Save Preset, Import JSON, Export JSON, Export PNG */}
            <div className="header-right">
                <button
                    className="btn btn-save"
                    onClick={onSavePreset}
                    title="Lưu preset vào bộ nhớ"
                >
                    <Bookmark size={15} />
                    <span>Save Preset</span>
                </button>

                <button
                    className="btn btn-import-json"
                    onClick={onImportJson}
                    title="Nhập cấu hình từ file JSON"
                >
                    <FileUp size={15} />
                    <span>Import JSON</span>
                </button>

                <button
                    className="btn btn-export-json"
                    onClick={onExportJson}
                    title="Xuất cấu hình ra file JSON"
                >
                    <FileJson size={15} />
                    <span>Export JSON</span>
                </button>

                <button
                    className="btn btn-export-png"
                    onClick={onExportImage}
                    title="Xuất timeline thành ảnh PNG"
                >
                    <Image size={15} />
                    <span>Export PNG</span>
                </button>
            </div>
        </header>
    );
}
