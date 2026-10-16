import { CHARACTERS_DATABASE, BASIC_MOVES } from "../data/constants";

const MOVES_STORAGE_KEY = "wuwa_custom_moves";
const PRESETS_STORAGE_KEY = "wuwa_saved_presets";
const OPEN_TABS_STORAGE_KEY = "wuwa_open_tabs";
const ACTIVE_TAB_ID_KEY = "wuwa_active_tab_id";

export const getStoredMoves = () => {
    try {
        const data = localStorage.getItem(MOVES_STORAGE_KEY);
        return data ? JSON.parse(data) : BASIC_MOVES;
    } catch {
        return BASIC_MOVES;
    }
};

export const saveStoredMoves = (moves) => {
    localStorage.setItem(MOVES_STORAGE_KEY, JSON.stringify(moves));
};

export const serializeData = (name, team, rows, id = null) => {
    return {
        id:
            id ||
            `preset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name || "Preset 1",
        updatedAt: new Date().toISOString(),
        team: (team || [null, null, null]).map((c) => (c ? c.id : null)),
        rows: (rows || [])
            .filter((r) => r && r.character !== null)
            .map((r) => ({
                charId: r.character.id,
                actions: (r.actions || []).map((a) => ({
                    id: a.id,
                    bgColor: a.backgroundColor,
                    textColor: a.textColor,
                })),
            })),
    };
};

export const deserializeData = (savedData) => {
    if (!savedData) {
        return {
            name: "Preset 1",
            team: [null, null, null],
            rows: [{ id: `row-${Date.now()}`, character: null, actions: [] }],
        };
    }

    const team = (savedData.team || [null, null, null]).map((charId) => {
        return charId
            ? CHARACTERS_DATABASE.find((c) => c.id === charId) || null
            : null;
    });

    const rawRows = Array.isArray(savedData.rows) ? savedData.rows : [];
    const rows = rawRows.map((r, rIdx) => {
        const char = r.charId
            ? CHARACTERS_DATABASE.find((c) => c.id === r.charId) || null
            : r.character || null;
        const actions = (r.actions || []).map((act, aIdx) => ({
            instanceId: act.instanceId || `act-${rIdx}-${aIdx}-${Date.now()}`,
            id: typeof act === "string" ? act : act.id,
            label: typeof act === "string" ? act : act.label || act.id,
            backgroundColor: act.bgColor || act.backgroundColor || "#3e4856",
            textColor: act.textColor || "#ffffff",
        }));

        return {
            id: r.id || `row-${rIdx}-${Date.now()}`,
            character: char,
            actions,
        };
    });

    return {
        name: savedData.name || "Preset 1",
        team,
        rows:
            rows.length > 0
                ? rows
                : [{ id: `row-${Date.now()}`, character: null, actions: [] }],
    };
};

export const getSavedPresets = () => {
    try {
        const data = localStorage.getItem(PRESETS_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

export const savePresetToList = (presetData) => {
    const list = getSavedPresets();
    const index = list.findIndex(
        (p) =>
            p.name.trim().toLowerCase() ===
            presetData.name.trim().toLowerCase(),
    );
    if (index !== -1) {
        list[index] = presetData;
    } else {
        list.unshift(presetData);
    }
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(list));
};

export const deletePresetFromList = (id) => {
    const list = getSavedPresets().filter((p) => p.id !== id);
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(list));
};

export const getOpenTabs = () => {
    try {
        const data = localStorage.getItem(OPEN_TABS_STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch {
        // fallback
    }

    return [
        {
            id: "tab_default",
            name: "Preset 1",
            team: [null, null, null],
            rows: [{ id: "row-1", character: null, actions: [] }],
        },
    ];
};

export const saveOpenTabs = (tabs) => {
    localStorage.setItem(OPEN_TABS_STORAGE_KEY, JSON.stringify(tabs || []));
};

export const getActiveTabId = () => {
    return localStorage.getItem(ACTIVE_TAB_ID_KEY) || "tab_default";
};

export const saveActiveTabId = (id) => {
    if (id) {
        localStorage.setItem(ACTIVE_TAB_ID_KEY, id);
    } else {
        localStorage.removeItem(ACTIVE_TAB_ID_KEY);
    }
};

export const resetStoredMoves = () => {
    localStorage.removeItem(MOVES_STORAGE_KEY);
    return BASIC_MOVES;
};
