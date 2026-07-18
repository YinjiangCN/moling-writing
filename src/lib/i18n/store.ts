'use client'

import { create } from 'zustand'
import type { Lang } from './translations'
import { translations, t as translate } from './translations'

const STORAGE_KEY = 'moli-lang'

interface I18nState {
  lang: Lang
  hydrated: boolean
  setLang: (lang: Lang) => void
  hydrate: () => void
  t: (key: string) => string
}

export const useI18n = create<I18nState>((set, get) => ({
  lang: 'zh',
  hydrated: false,
  setLang: (lang) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang)
    }
    set({ lang })
  },
  hydrate: () => {
    if (typeof window === 'undefined') return
    if (get().hydrated) return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && translations[stored as Lang]) {
      set({ lang: stored as Lang, hydrated: true })
    } else {
      set({ hydrated: true })
    }
  },
  t: (key) => translate(get().lang, key),
}))
