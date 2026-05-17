import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SF10Version {
  id: string;
  timestamp: number;
  label: string;
  overrides: Record<string, string>;
}

interface SF10State {
  // Key: studentLRN_sheetName
  overrides: Record<string, Record<string, string>>;
  history: Record<string, SF10Version[]>;
  
  setOverride: (studentLRN: string, sheetName: string, cellRef: string, value: string) => void;
  saveSnapshot: (studentLRN: string, sheetName: string, label: string) => void;
  restoreSnapshot: (studentLRN: string, sheetName: string, versionId: string) => void;
  deleteSnapshot: (studentLRN: string, sheetName: string, versionId: string) => void;
  clearOverrides: (studentLRN: string, sheetName: string) => void;
}

export const useSF10Store = create<SF10State>()(
  persist(
    (set, get) => ({
      overrides: {},
      history: {},

      setOverride: (studentLRN, sheetName, cellRef, value) => {
        const key = `${studentLRN}_${sheetName}`;
        set((state) => ({
          overrides: {
            ...state.overrides,
            [key]: {
              ...(state.overrides[key] || {}),
              [cellRef]: value,
            },
          },
        }));
      },

      saveSnapshot: (studentLRN, sheetName, label) => {
        const key = `${studentLRN}_${sheetName}`;
        const currentOverrides = get().overrides[key] || {};
        
        const newVersion: SF10Version = {
          id: Math.random().toString(36).substring(7),
          timestamp: Date.now(),
          label,
          overrides: { ...currentOverrides },
        };

        set((state) => ({
          history: {
            ...state.history,
            [key]: [newVersion, ...(state.history[key] || [])].slice(0, 20), // Keep last 20 versions
          },
        }));
      },

      restoreSnapshot: (studentLRN, sheetName, versionId) => {
        const key = `${studentLRN}_${sheetName}`;
        const versions = get().history[key] || [];
        const version = versions.find((v) => v.id === versionId);
        
        if (version) {
          set((state) => ({
            overrides: {
              ...state.overrides,
              [key]: { ...version.overrides },
            },
          }));
        }
      },

      deleteSnapshot: (studentLRN, sheetName, versionId) => {
        const key = `${studentLRN}_${sheetName}`;
        set((state) => ({
          history: {
            ...state.history,
            [key]: (state.history[key] || []).filter((v) => v.id !== versionId),
          },
        }));
      },
      
      clearOverrides: (studentLRN, sheetName) => {
        const key = `${studentLRN}_${sheetName}`;
        set((state) => {
          const newOverrides = { ...state.overrides };
          delete newOverrides[key];
          return { overrides: newOverrides };
        });
      },
    }),
    {
      name: 'sf10-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
