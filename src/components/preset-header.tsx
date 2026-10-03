import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { CopyPermalink } from '@/components/copy-permalink'

export function PresetHeader({
  modified,
  error,
  createPermalink,
  onSave,
  onReset,
}: {
  createPermalink: () => string
  modified: boolean
  error: string
  onSave: () => void
  onReset: () => void
}) {
  return (
    <header className="absolute inset-x-6 top-6 z-10 max-[801px]:inset-x-3 max-[801px]:top-3">
      <div className="flex items-center gap-4 max-[521px]:grid max-[521px]:grid-cols-[1fr_auto] max-[521px]:gap-2">
        <CopyPermalink createPermalink={createPermalink} />
        <Separator orientation="vertical" className="max-[521px]:hidden" />
        <div className="flex items-center gap-1 max-[521px]:col-span-2 max-[521px]:row-start-2">
          <Button variant="outline" size="lg" disabled={!modified} onClick={onSave}>
            Save as default
          </Button>
          <Button variant="ghost" size="lg" disabled={!modified} onClick={onReset}>
            Reset
          </Button>
        </div>
        <div className="ml-auto max-[521px]:col-start-2 max-[521px]:row-start-1">
          <ThemeToggle />
        </div>
      </div>
      {error && (
        <Alert variant="destructive" className="mt-2 max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </header>
  )
}
