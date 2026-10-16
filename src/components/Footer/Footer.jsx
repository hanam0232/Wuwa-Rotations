import React, { useState, useEffect, useRef } from "react";
import "./Footer.css";

export default function Footer({
    presets,
    activePresetId,
    onSelectPreset,
    onAddNewPreset,
    onCloseTab,
    onCloseOtherTabs,
    onCloseAllTabs,
    onReorderTabs,
}) {
    const [isScrolling, setIsScrolling] = useState(false);
    const [scrollThumb, setScrollThumb] = useState({
        width: 0,
        left: 0,
        show: false,
    });

    const scrollTimeoutRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const [draggedTabIndex, setDraggedTabIndex] = useState(null);

    const [contextMenu, setContextMenu] = useState({
        visible: false,
        x: 0,
        y: 0,
        tabId: null,
    });

    // Tính toán vị trí và độ rộng của thanh cuộn nổi custom
    const updateScrollThumb = () => {
        const el = scrollContainerRef.current;
        if (!el) return;

        const { scrollWidth, clientWidth, scrollLeft } = el;
        if (scrollWidth <= clientWidth) {
            setScrollThumb({ width: 0, left: 0, show: false });
            return;
        }

        const thumbWidth = Math.max(
            (clientWidth / scrollWidth) * clientWidth,
            30,
        );
        const maxScrollLeft = scrollWidth - clientWidth;
        const maxThumbLeft = clientWidth - thumbWidth;
        const thumbLeft = (scrollLeft / maxScrollLeft) * maxThumbLeft;

        setScrollThumb({ width: thumbWidth, left: thumbLeft, show: true });
    };

    const handleScroll = () => {
        updateScrollThumb();
        setIsScrolling(true);

        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
        }, 1000);
    };

    // Cập nhật lại thanh cuộn khi thay đổi số lượng tab
    useEffect(() => {
        updateScrollThumb();
    }, [presets]);

    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current)
                clearTimeout(scrollTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        const handleGlobalClick = () => {
            if (contextMenu.visible) {
                setContextMenu({ visible: false, x: 0, y: 0, tabId: null });
            }
        };
        window.addEventListener("click", handleGlobalClick);
        return () => window.removeEventListener("click", handleGlobalClick);
    }, [contextMenu.visible]);

    const handleContextMenu = (e, tabId) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY - 80,
            tabId,
        });
    };

    const handleDragStart = (e, index) => {
        setDraggedTabIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
    };

    const handleDragOver = (e, overIndex) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (draggedTabIndex === null || draggedTabIndex === overIndex) return;

        onReorderTabs(draggedTabIndex, overIndex);
        setDraggedTabIndex(overIndex);
    };

    const handleDragEnd = () => {
        setDraggedTabIndex(null);
    };

    return (
        <footer className="app-footer">
            <div
                className="preset-tabs-list"
                ref={scrollContainerRef}
                onScroll={handleScroll}
            >
                {presets.map((preset, index) => (
                    <div
                        key={preset.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        onContextMenu={(e) => handleContextMenu(e, preset.id)}
                        className={`preset-tab-btn ${activePresetId === preset.id ? "active" : ""} ${
                            draggedTabIndex === index ? "is-dragging" : ""
                        }`}
                        onClick={() => onSelectPreset(preset.id)}
                    >
                        <span className="preset-tab-title">{preset.name}</span>
                        <button
                            className="preset-tab-close"
                            title="Đóng tab"
                            onClick={(e) => {
                                e.stopPropagation();
                                onCloseTab(preset.id);
                            }}
                        >
                            ×
                        </button>
                    </div>
                ))}

                <button
                    className="preset-tab-btn add-tab-btn"
                    onClick={onAddNewPreset}
                    title="Tạo file xoay vòng mới"
                >
                    +
                </button>
            </div>

            {/* Thanh cuộn nổi độc lập đè lên trên sát mép dưới footer */}
            {scrollThumb.show && (
                <div
                    className={`custom-floating-scrollbar ${isScrolling ? "visible" : ""}`}
                >
                    <div
                        className="custom-floating-thumb"
                        style={{
                            width: `${scrollThumb.width}px`,
                            transform: `translateX(${scrollThumb.left}px)`,
                        }}
                    />
                </div>
            )}

            {contextMenu.visible && (
                <div
                    className="tab-context-menu"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        className="tab-context-menu-item"
                        onClick={() => {
                            onCloseOtherTabs(contextMenu.tabId);
                            setContextMenu({
                                visible: false,
                                x: 0,
                                y: 0,
                                tabId: null,
                            });
                        }}
                    >
                        Đóng tất cả các tab khác
                    </div>
                    <div
                        className="tab-context-menu-item"
                        onClick={() => {
                            onCloseAllTabs();
                            setContextMenu({
                                visible: false,
                                x: 0,
                                y: 0,
                                tabId: null,
                            });
                        }}
                    >
                        Đóng tất cả các tab
                    </div>
                </div>
            )}
        </footer>
    );
}
