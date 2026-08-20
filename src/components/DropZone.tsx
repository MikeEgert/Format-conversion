import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react'

interface DropZoneProps {
  accept: string
  disabled?: boolean
  onFiles: (files: File[]) => void
}

export function DropZone({ accept, disabled, onFiles }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function openPicker() {
    if (!disabled) inputRef.current?.click()
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onFiles(files)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openPicker()
    }
  }

  return (
    <div
      className={dragging ? 'dropzone dragging' : 'dropzone'}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={openPicker}
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onKeyDown={handleKeyDown}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) onFiles(files)
          e.target.value = ''
        }}
      />
      <svg className="dropzone-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 16V4m0 0L8 8m4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="dropzone-title">Drop files here</p>
      <p className="dropzone-hint">or click to browse — select more than one to batch convert</p>
    </div>
  )
}
