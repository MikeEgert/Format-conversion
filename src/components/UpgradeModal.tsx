import { useState, type FormEvent } from 'react'
import { usePro } from '../pro/usePro'

interface UpgradeModalProps {
  onClose: () => void
  onUnlocked: () => void
}

export function UpgradeModal({ onClose, onUnlocked }: UpgradeModalProps) {
  const { unlock } = usePro()
  const [key, setKey] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setChecking(true)
    setError(null)
    const ok = await unlock(key)
    setChecking(false)
    if (ok) {
      onUnlocked()
    } else {
      setError("That key isn't valid. Try again.")
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2>Go Pro for batch conversion</h2>
        <p className="modal-copy">
          Free users convert one file at a time. Pro unlocks batch conversion and one-click ZIP
          downloads — all still processed locally on your device.
        </p>

        <form className="modal-form" onSubmit={handleSubmit}>
          <input
            className="modal-input"
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="License key"
            autoFocus
          />
          {error && <p className="modal-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={checking}>
            {checking ? 'Checking…' : 'Unlock Pro'}
          </button>
        </form>

        <p className="modal-hint">
          Preview the Pro tier with the demo key <code>PRO-DEMO-2026</code>
        </p>
      </div>
    </div>
  )
}
