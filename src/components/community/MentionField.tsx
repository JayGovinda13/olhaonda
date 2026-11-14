import { Box, ListItemButton, ListItemText, Paper, TextField, type TextFieldProps } from '@mui/material'
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { backend, type MemberHit } from '../../backend'
import { alpha, brand } from '../../theme'
import { activeMention } from '../../lib/mentions'

type Props = Omit<TextFieldProps, 'onChange' | 'value'> & { value: string; onChange: (value: string) => void }

/** Caixa de texto do fórum: ao digitar "@" sugere pessoas para marcar (setas + Enter, ou toque). */
export function MentionField({ value, onChange, onKeyDown, ...rest }: Props) {
  const box = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const [token, setToken] = useState<{ start: number; query: string } | null>(null)
  const [items, setItems] = useState<MemberHit[]>([])
  const [active, setActive] = useState(0)

  // busca com um pequeno atraso enquanto a pessoa digita depois do @
  useEffect(() => {
    if (!token) return
    let alive = true
    const t = setTimeout(() => {
      backend.forum
        .searchMembers(token.query)
        .then((r) => {
          if (!alive) return
          setItems(r)
          setActive(0)
        })
        .catch(() => alive && setItems([]))
    }, 150)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [token])

  const open = token !== null && items.length > 0

  const detect = (text: string, caret: number) => setToken(activeMention(text, caret))

  const change = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value)
    detect(e.target.value, e.target.selectionStart ?? e.target.value.length)
  }

  const pick = (m: MemberHit) => {
    if (!token) return
    const caret = box.current?.selectionStart ?? value.length
    const next = `${value.slice(0, token.start)}@${m.username} ${value.slice(caret)}`
    onChange(next)
    setToken(null)
    const pos = token.start + m.username.length + 2
    requestAnimationFrame(() => {
      box.current?.focus()
      box.current?.setSelectionRange(pos, pos)
    })
  }

  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActive((a) => (a + 1) % items.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((a) => (a - 1 + items.length) % items.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        pick(items[active])
      } else if (e.key === 'Escape') {
        e.stopPropagation()
        setToken(null)
      }
    }
    onKeyDown?.(e)
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        {...rest}
        fullWidth
        value={value}
        onChange={change}
        onKeyDown={keys}
        onClick={(e) => detect(value, (e.target as HTMLTextAreaElement).selectionStart ?? value.length)}
        onBlur={() => setTimeout(() => setToken(null), 120)}
        inputRef={box}
        helperText={rest.helperText ?? 'Digite @ para marcar alguém'}
      />
      {open && (
        <Paper elevation={6} role="listbox" aria-label="Pessoas para marcar" sx={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% - 22px)', zIndex: 20, borderRadius: '14px', overflow: 'hidden', bgcolor: brand.sand, backgroundImage: 'none', border: `1px solid ${alpha(brand.purple, 0.18)}` }}>
          {items.map((m, i) => (
            <ListItemButton
              key={m.username}
              role="option"
              aria-selected={i === active}
              selected={i === active}
              onMouseDown={(e) => e.preventDefault()} // não tira o foco da caixa de texto
              onClick={() => pick(m)}
              dense
            >
              <ListItemText primary={`@${m.username}`} secondary={m.name} slotProps={{ primary: { sx: { fontWeight: 800 } } }} />
            </ListItemButton>
          ))}
        </Paper>
      )}
    </Box>
  )
}
