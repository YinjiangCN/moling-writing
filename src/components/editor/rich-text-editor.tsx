'use client'

import { useRef, useEffect, useCallback } from 'react'
import {
  MDXEditor,
  type MDXEditorMethods,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  linkPlugin,
  linkDialogPlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  UndoRedo,
  BlockTypeSelect,
  CreateLink,
  ListsToggle,
  Separator,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  editorMode?: 'normal' | 'focus' | 'typewriter'
  onSelectionChange?: (selectedText: string) => void
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = '开始你的创作...',
  editorMode = 'normal',
  onSelectionChange,
}: Props) {
  const editorRef = useRef<MDXEditorMethods>(null)

  // 同步外部 value 到编辑器（仅在值不同时更新）
  useEffect(() => {
    if (editorRef.current) {
      const currentMarkdown = editorRef.current.getMarkdown()
      if (currentMarkdown !== value) {
        editorRef.current.setMarkdown(value)
      }
    }
  }, [value])

  // 处理选中文本
  const handleSelectionChange = useCallback(() => {
    if (!onSelectionChange) return
    const selection = window.getSelection()
    if (selection && selection.toString()) {
      onSelectionChange(selection.toString())
    } else {
      onSelectionChange('')
    }
  }, [onSelectionChange])

  return (
    <div className={`rich-text-editor h-full flex flex-col ${editorMode === 'typewriter' ? 'typewriter-mode' : ''} ${editorMode === 'focus' ? 'focus-mode' : ''}`}>
      <MDXEditor
        ref={editorRef}
        markdown={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 dark-theme"
        contentEditableClassName={`prose prose-sm dark:prose-invert max-w-none min-h-full ${editorMode === 'typewriter' ? 'typewriter-content' : ''} ${editorMode === 'focus' ? 'focus-content' : ''}`}
        plugins={[
          headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
          listsPlugin(),
          quotePlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          diffSourcePlugin({ viewMode: 'rich-text' }),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BoldItalicUnderlineToggles />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <ListsToggle />
                <Separator />
                <CreateLink />
                <DiffSourceToggleWrapper>
                  <Separator />
                </DiffSourceToggleWrapper>
              </>
            ),
          }),
        ]}
        onSelect={handleSelectionChange}
      />
    </div>
  )
}
