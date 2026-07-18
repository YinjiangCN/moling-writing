'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lang } from './translations'
import { translations, t as translate } from './translations'

interface I18nState {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string) => string
}

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      lang: 'zh',
      setLang: (lang) => set({ lang }),
      t: (key) => translate(get().lang, key),
    }),
    { name: 'moli-lang' }
  )
)
