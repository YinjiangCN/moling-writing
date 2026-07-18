'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n/store'
import { LANGUAGES } from '@/lib/i18n/translations'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe, Check } from 'lucide-react'

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n()
  const [mounted] = useState(true)

  if (!mounted) return null

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2">
          <Globe className="w-3.5 h-3.5" />
          <span className="text-xs hidden sm:inline">{current.name}</span>
          <span className="text-base sm:hidden">{current.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className="gap-2 cursor-pointer"
          >
            <span className="text-base">{l.flag}</span>
            <span className="flex-1">{l.name}</span>
            {lang === l.code && <Check className="w-3.5 h-3.5 text-emerald-500" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
