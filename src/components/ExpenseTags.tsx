"use client"

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { parseExpenseTags } from '@/lib/expense-tags'
import { X } from 'lucide-react'

export function ExpenseTagsField({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  // Keep the draft editable even when submission validation rejects a tag.
  const tags = value.split(',').map(tag => tag.trim()).filter(Boolean)
  let validationError = error
  try { parseExpenseTags(value) } catch (cause) { validationError = (cause as Error).message }
  return (
    <div className="space-y-2 min-w-0">
      <Label htmlFor="expense-tags">Etiquetas <span className="text-muted-foreground font-normal">(opcional)</span></Label>
      <Input id="expense-tags" value={value} onChange={event => onChange(event.target.value)} placeholder="Ej. viaje, familia" aria-invalid={Boolean(validationError)} aria-describedby={validationError ? 'expense-tags-error' : 'expense-tags-hint'} className="h-11 text-base sm:text-sm" />
      <p id="expense-tags-hint" className="text-xs text-foreground">Separadas por comas. Hasta 10 etiquetas de 30 caracteres.</p>
      {validationError && <p id="expense-tags-error" role="alert" className="text-sm text-destructive">{validationError}</p>}
      {tags.length > 0 && <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, index) => <Badge key={`${index}-${tag}`} variant="secondary" className="gap-1 font-normal max-w-full break-all">#{tag}<button type="button" aria-label={`Quitar etiqueta ${tag}`} onClick={() => onChange(tags.filter((_, itemIndex) => itemIndex !== index).join(', '))} className="inline-flex items-center justify-center min-h-11 min-w-11 sm:min-h-6 sm:min-w-6 shrink-0 rounded-sm hover:bg-muted focus-visible:outline focus-visible:outline-2"><X aria-hidden="true" className="h-3 w-3" /></button></Badge>)}
      </div>}
    </div>
  )
}

export function ExpenseTags({ tags }: { tags?: readonly string[] }) {
  if (!tags?.length) return null
  return <div aria-label="Etiquetas" className="mt-1.5 flex flex-wrap gap-1">{tags.map(tag => <Badge key={tag} variant="secondary" className="font-normal text-xs break-all max-w-full">#{tag}</Badge>)}</div>
}
