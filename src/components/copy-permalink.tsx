import { useEffect, useRef, useState } from 'react'
import { CheckIcon, ClipboardIcon, XIcon } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function CopyPermalink({ createPermalink }: { createPermalink: () => string }) {
  const button = useRef<HTMLButtonElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [fallbackLink, setFallbackLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [copying, setCopying] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    clearTimeout(timer.current)
    setCopied(false)
    setFallbackLink('')
    setCopying(true)
    const link = createPermalink()
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setFallbackLink(link)
    } finally {
      setCopying(false)
    }
  }

  return (
    <Popover
      open={Boolean(fallbackLink)}
      onOpenChange={(open) => {
        if (!open) setFallbackLink('')
      }}
    >
      <Button
        ref={button}
        aria-haspopup="dialog"
        aria-expanded={Boolean(fallbackLink)}
        className="w-32"
        variant="outline"
        size="lg"
        disabled={copying}
        onClick={copy}
        aria-live="polite"
      >
        {copied ? (
          <CheckIcon className="text-green-700 dark:text-green-400" aria-hidden="true" />
        ) : (
          <ClipboardIcon aria-hidden="true" />
        )}
        {copied ? 'Copied' : 'Copy permalink'}
      </Button>
      <PopoverContent
        anchor={button}
        align="start"
        sideOffset={8}
        initialFocus={input}
        finalFocus={button}
        className="w-95 max-w-[calc(100vw-24px)]"
      >
        <PopoverHeader>
          <div className="flex items-center justify-between gap-4">
            <PopoverTitle>Copy preset link</PopoverTitle>
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Close"
              onClick={() => setFallbackLink('')}
            >
              <XIcon aria-hidden="true" />
            </Button>
          </div>
          <PopoverDescription>Clipboard unavailable. Copy this link manually.</PopoverDescription>
        </PopoverHeader>
        <Input
          ref={input}
          className="font-mono selection:bg-primary selection:text-primary-foreground"
          aria-label="Preset permalink"
          readOnly
          value={fallbackLink}
          onFocus={(event) => event.currentTarget.select()}
        />
      </PopoverContent>
    </Popover>
  )
}
