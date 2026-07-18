'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/store'
import { LANGUAGES } from '@/lib/i18n/translations'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Globe, Check } from 'lucide-react'

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n()
  const [open, setOpen] = useState(false)

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0]

  const handleSelect = (code: string) => {
    setLang(code as any)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2">
          <Globe className="w-3.5 h-3.5" />
          <span className="text-xs hidden sm:inline">{current.name}</span>
          <span className="text-base sm:hidden">{current.flag}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="end">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => handleSelect(l.code)}
            className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded text-sm cursor-pointer text-left"
          >
            <span className="text-base">{l.flag}</span>
            <span className="flex-1">{l.name}</span>
            {lang === l.code && <Check className="w-3.5 h-3.5 text-emerald-500" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
