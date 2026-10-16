import { useState, useEffect } from "react";
import Header from "./components/Header/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import TimelineSheet from "./components/Timeline/TimelineSheet";
import Footer from "./components/Footer/Footer";
import CharacterModal from "./components/CharacterModal/CharacterModal";
import ProfileModal from "./components/ProfileModal/ProfileModal";
import ExportPreviewModal from "./components/ExportPreviewModal/ExportPreviewModal";
import AlertModal from "./components/AlertModal/AlertModal";
import {
    getOpenTabs,
    saveOpenTabs,
    getActiveTabId,
    saveActiveTabId,
    deserializeData,
    serializeData,
    savePresetToList,
} from "./utils/storage";
import {
    exportPresetToJson,
    importPresetFromJson,
    generateTimelineImage,
    downloadImage,
} from "./utils/exporter";
import "./App.css";

export default function App() {
    const [openTabs, setOpenTabs] = useState(() => getOpenTabs());
    const [activeTabId, setActiveTabId] = useState(() => {
        const tabs = getOpenTabs();
        const storedActiveId = getActiveTabId();
        const found = tabs.find((t) => t.id === storedActiveId);
        return found ? found.id : tabs.length > 0 ? tabs[0].id : null;
    });

    const [isCharModalOpen, setIsCharModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [dialog, setDialog] = useState(null);
    const [toastMessage, setToastMessage] = useState("");

    // State cho Preview Modal Export PNG
    const [previewImageModal, setPreviewImageModal] = useState({
        isOpen: false,
        imageUrl: "",
        fileName: "",
    });

    useEffect(() => {
        saveOpenTabs(openTabs);
        saveActiveTabId(activeTabId);
    }, [openTabs, activeTabId]);

    useEffect(() => {
        if (!toastMessage) return undefined;

        const timeoutId = window.setTimeout(() => {
            setToastMessage("");
        }, 1600);

        return () => window.clearTimeout(timeoutId);
    }, [toastMessage]);

    const activeTab =
        openTabs.find((t) => t.id === activeTabId) ||
        (openTabs.length > 0 ? openTabs[0] : null);
    const activeData = activeTab ? deserializeData(activeTab) : null;

    const rotationName = activeData ? activeData.name : "";
    const selectedTeam = activeData ? activeData.team : [null, null, null];
    const rows = activeData ? activeData.rows : [];

    const showAlert = (message, title = "Thông báo") => {
        setDialog({ type: "alert", title, message });
    };

    const showConfirmation = (title, message, onConfirm) => {
        setDialog({ type: "confirm", title, message, onConfirm });
    };

    const updateActiveTabDirectly = (updater) => {
        if (!activeTab) return;
        setOpenTabs((prevTabs) =>
            prevTabs.map((tab) => {
                if (tab.id !== activeTab.id) return tab;
                const currentData = deserializeData(tab);
                const updated = updater(currentData);
                return serializeData(
                    updated.name !== undefined
                        ? updated.name
                        : currentData.name,
                    updated.team !== undefined
                        ? updated.team
                        : currentData.team,
                    updated.rows !== undefined
                        ? updated.rows
                        : currentData.rows,
                    tab.id,
                );
            }),
        );
    };

    const handleSelectPreset = (presetId) => {
        setActiveTabId(presetId);
    };

    const handleCloseTab = (tabIdToClose) => {
        const nextTabs = openTabs.filter((t) => t.id !== tabIdToClose);
        setOpenTabs(nextTabs);

        if (tabIdToClose === activeTabId) {
            if (nextTabs.length > 0) {
                setActiveTabId(nextTabs[nextTabs.length - 1].id);
            } else {
                setActiveTabId(null);
            }
        }
    };

    const handleCloseOtherTabs = (tabIdToKeep) => {
        const nextTabs = openTabs.filter((t) => t.id === tabIdToKeep);
        setOpenTabs(nextTabs);
        setActiveTabId(tabIdToKeep);
    };

    const handleCloseAllTabs = () => {
        setOpenTabs([]);
        setActiveTabId(null);
    };

    const handleReorderTabs = (sourceIndex, targetIndex) => {
        setOpenTabs((prev) => {
            const nextTabs = [...prev];
            const [moved] = nextTabs.splice(sourceIndex, 1);
            nextTabs.splice(targetIndex, 0, moved);
            return nextTabs;
        });
    };

    const handleAddNewPreset = () => {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 7);
        const newId = `tab_${timestamp}_${randomSuffix}`;
        const newName = `Preset ${openTabs.length + 1}`;

        const newTab = {
            id: newId,
            name: newName,
            team: [null, null, null],
            rows: [{ id: `row-${timestamp}`, character: null, actions: [] }],
        };

        setOpenTabs((prev) => [...prev, newTab]);
        setActiveTabId(newId);
    };

    const handleSavePreset = () => {
        if (!activeTab) return;
        setDialog({
            type: "prompt",
            title: "Lưu Preset",
            message: "Nhập tên cho Preset này:",
            inputDefaultValue: rotationName,
            confirmText: "Lưu",
            onConfirm: (inputName) => {
                const finalName = inputName.trim();
                updateActiveTabDirectly((cur) => ({
                    ...cur,
                    name: finalName,
                }));

                const presetData = serializeData(
                    finalName,
                    selectedTeam,
                    rows,
                    activeTab.id,
                );
                savePresetToList(presetData);
                setToastMessage(`Đã lưu preset "${finalName}" vào Profile!`);
            },
        });
    };

    const handleExportJson = () => {
        if (!activeTab) return;
        const currentTabSerialized = serializeData(
            rotationName,
            selectedTeam,
            rows,
            activeTab.id,
        );
        exportPresetToJson(currentTabSerialized);
    };

    const handleImportJson = () => {
        importPresetFromJson(
            (importedData) => {
                const newId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                const newTab = {
                    ...importedData,
                    id: newId,
                    name: importedData.name || "Imported Preset",
                };

                setOpenTabs((prev) => [...prev, newTab]);
                setActiveTabId(newId);
            },
            () => {
                showAlert("File JSON không hợp lệ!", "Lỗi nhập dữ liệu");
            },
        );
    };

    // Mở modal xem trước ảnh
    const handleOpenExportImagePreview = async () => {
        if (!activeTab) return;
        const url = await generateTimelineImage("timeline-export-capture");
        if (!url) {
            showAlert("Không có dữ liệu hợp lệ để xuất ảnh!", "Lỗi xuất ảnh");
            return;
        }
        setPreviewImageModal({
            isOpen: true,
            imageUrl: url,
            fileName: `${rotationName || "rotation"}.png`,
        });
    };

    // Xác nhận tải ảnh từ modal
    const handleConfirmDownloadImage = () => {
        downloadImage(previewImageModal.imageUrl, previewImageModal.fileName);
        setPreviewImageModal({ isOpen: false, imageUrl: "", fileName: "" });
    };

    const handleLoadPresetFromProfile = (preset) => {
        const existingIndex = openTabs.findIndex((t) => t.id === preset.id);
        if (existingIndex === -1) {
            setOpenTabs((prev) => [...prev, preset]);
        }
        setActiveTabId(preset.id);
    };

    const hasTimelineContent = () => {
        return rows.some((r) => r.character !== null || r.actions.length > 0);
    };

    const isTeamChanged = (oldTeam, newTeam) => {
        return oldTeam.some((char, idx) => {
            const oldId = char ? char.id : null;
            const newId = newTeam[idx] ? newTeam[idx].id : null;
            return oldId !== newId;
        });
    };

    const handleSaveTeam = (newTeam) => {
        if (isTeamChanged(selectedTeam, newTeam)) {
            if (hasTimelineContent()) {
                showConfirmation(
                    "Thay đổi đội hình",
                    "Thay đổi đội hình sẽ xóa toàn bộ nội dung trong Timeline hiện tại. Bạn có chắc chắn muốn đổi không?",
                    () => {
                        updateActiveTabDirectly(() => ({
                            team: newTeam,
                            rows: [
                                {
                                    id: `row-${Date.now()}`,
                                    character: null,
                                    actions: [],
                                },
                            ],
                        }));
                        setIsCharModalOpen(false);
                    },
                );
                return;
            }
        }
        updateActiveTabDirectly((cur) => ({ ...cur, team: newTeam }));
        setIsCharModalOpen(false);
    };

    const handleDropCharOnRow = (e, rowIndex) => {
        e.preventDefault();
        if (e.dataTransfer.getData("type") !== "character") return;
        const char = JSON.parse(e.dataTransfer.getData("data"));
        updateActiveTabDirectly((cur) => {
            const nextRows = [...cur.rows];
            nextRows[rowIndex].character = char;
            return { ...cur, rows: nextRows };
        });
    };

    const handleDropSkillOnRow = (rowIndex, skill, insertIndex) => {
        updateActiveTabDirectly((cur) => {
            const nextRows = [...cur.rows];
            const targetActions = [...nextRows[rowIndex].actions];

            const newAction = {
                instanceId: `act-${Date.now()}-${Math.random()}`,
                id: skill.id,
                label: skill.id,
                backgroundColor: skill.bgColor || "#3e4856",
                textColor: skill.textColor || "#ffffff",
            };

            const actualIdx =
                insertIndex !== null
                    ? Math.min(insertIndex, targetActions.length)
                    : targetActions.length;
            targetActions.splice(actualIdx, 0, newAction);
            nextRows[rowIndex].actions = targetActions;
            return { ...cur, rows: nextRows };
        });
    };

    const handleReorderSkillOnRow = (rowIndex, sourceIdx, targetIdx) => {
        if (sourceIdx === targetIdx || targetIdx === null) return;
        updateActiveTabDirectly((cur) => {
            const nextRows = [...cur.rows];
            const targetActions = [...nextRows[rowIndex].actions];
            const [movedItem] = targetActions.splice(sourceIdx, 1);
            const destIdx = Math.min(targetIdx, targetActions.length);
            targetActions.splice(destIdx, 0, movedItem);
            nextRows[rowIndex].actions = targetActions;
            return { ...cur, rows: nextRows };
        });
    };

    const handleDropCreateNewRow = (e) => {
        e.preventDefault();
        if (e.dataTransfer.getData("type") !== "character") return;
        const char = JSON.parse(e.dataTransfer.getData("data"));
        updateActiveTabDirectly((cur) => ({
            ...cur,
            rows: [
                ...cur.rows,
                { id: `row-${Date.now()}`, character: char, actions: [] },
            ],
        }));
    };

    const handleDeleteRow = (rowIndex) => {
        updateActiveTabDirectly((cur) => {
            if (cur.rows.length === 1) {
                return {
                    ...cur,
                    rows: [
                        {
                            id: `row-${Date.now()}`,
                            character: null,
                            actions: [],
                        },
                    ],
                };
            }
            return {
                ...cur,
                rows: cur.rows.filter((_, idx) => idx !== rowIndex),
            };
        });
    };

    const handleDeletePlacedSkill = (rowIndex, actionIndex) => {
        if (rowIndex < 0 || rowIndex >= rows.length) return;
        updateActiveTabDirectly((cur) => {
            const nextRows = [...cur.rows];
            nextRows[rowIndex].actions.splice(actionIndex, 1);
            return { ...cur, rows: nextRows };
        });
    };

    return (
        <div className="app-root">
            <Header
                rotationName={rotationName}
                onSavePreset={handleSavePreset}
                onOpenProfile={() => setIsProfileOpen(true)}
                onExportJson={handleExportJson}
                onImportJson={handleImportJson}
                onExportImage={handleOpenExportImagePreview}
            />

            {toastMessage && (
                <div className="app-toast" role="status" aria-live="polite">
                    {toastMessage}
                </div>
            )}

            <div className="app-main-layout">
                <Sidebar
                    selectedTeam={selectedTeam}
                    onOpenModal={() => setIsCharModalOpen(true)}
                    onDeletePlacedSkill={handleDeletePlacedSkill}
                    onRequestConfirmation={showConfirmation}
                />
                {activeTab ? (
                    <TimelineSheet
                        rows={rows}
                        onDropCharOnRow={handleDropCharOnRow}
                        onDropSkillOnRow={handleDropSkillOnRow}
                        onReorderSkillOnRow={handleReorderSkillOnRow}
                        onDropCreateNewRow={handleDropCreateNewRow}
                        onDeleteRow={handleDeleteRow}
                        onDeleteSkill={handleDeletePlacedSkill}
                    />
                ) : (
                    <div style={{ flex: 1, backgroundColor: "#0b0e14" }} />
                )}
            </div>

            <Footer
                presets={openTabs}
                activePresetId={activeTab ? activeTab.id : null}
                onSelectPreset={handleSelectPreset}
                onAddNewPreset={handleAddNewPreset}
                onCloseTab={handleCloseTab}
                onCloseOtherTabs={handleCloseOtherTabs}
                onCloseAllTabs={handleCloseAllTabs}
                onReorderTabs={handleReorderTabs}
            />

            <CharacterModal
                isOpen={isCharModalOpen}
                onClose={() => setIsCharModalOpen(false)}
                onRequestConfirmation={showConfirmation}
                currentTeam={selectedTeam}
                onSaveTeam={handleSaveTeam}
            />

            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                onLoadPreset={handleLoadPresetFromProfile}
                onRequestConfirmation={showConfirmation}
            />

            <ExportPreviewModal
                isOpen={previewImageModal.isOpen}
                imageUrl={previewImageModal.imageUrl}
                fileName={previewImageModal.fileName}
                onClose={() =>
                    setPreviewImageModal({
                        isOpen: false,
                        imageUrl: "",
                        fileName: "",
                    })
                }
                onConfirmExport={handleConfirmDownloadImage}
            />

            {dialog && (
                <AlertModal
                    type={dialog.type}
                    title={dialog.title}
                    message={dialog.message}
                    inputDefaultValue={dialog.inputDefaultValue}
                    confirmText={dialog.confirmText}
                    onConfirm={dialog.onConfirm}
                    onClose={() => setDialog(null)}
                />
            )}
        </div>
    );
}
