'use client'

import { create } from 'zustand'

export type ViewType = 'workspace' | 'editor' | 'settings' | 'user'

interface AppState {
  // 视图状态
  view: ViewType
  currentNovelId: string | null
  currentChapterId: string | null
  currentFolderId: string | null

  // 编辑器模式
  editorMode: 'normal' | 'focus' | 'typewriter'
  theme: 'light' | 'dark' | 'eye'
  leftPanelOpen: boolean
  rightPanelOpen: boolean

  // AI 助手
  aiPanelOpen: boolean
  presetOpen: boolean

  // Actions
  setView: (v: ViewType) => void
  openNovel: (novelId: string) => void
  setCurrentChapter: (id: string | null) => void
  setCurrentFolder: (id: string | null) => void
  setEditorMode: (m: 'normal' | 'focus' | 'typewriter') => void
  setTheme: (t: 'light' | 'dark' | 'eye') => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  toggleAiPanel: () => void
  setPresetOpen: (v: boolean) => void
  backToWorkspace: () => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'workspace',
  currentNovelId: null,
  currentChapterId: null,
  currentFolderId: null,

  editorMode: 'normal',
  theme: 'light',
  leftPanelOpen: true,
  rightPanelOpen: true,

  aiPanelOpen: true,
  presetOpen: false,

  setView: (v) => set({ view: v }),
  openNovel: (novelId) =>
    set({ view: 'editor', currentNovelId: novelId, currentChapterId: null }),
  setCurrentChapter: (id) => set({ currentChapterId: id }),
  setCurrentFolder: (id) => set({ currentFolderId: id }),
  setEditorMode: (m) => set({ editorMode: m }),
  setTheme: (t) => set({ theme: t }),
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
  setPresetOpen: (v) => set({ presetOpen: v }),
  backToWorkspace: () =>
    set({ view: 'workspace', currentNovelId: null, currentChapterId: null }),
}))
