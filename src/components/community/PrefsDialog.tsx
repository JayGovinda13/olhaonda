import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Slider,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { Bell, ChatBubble } from 'iconoir-react'
import { Link as RouterLink } from 'react-router'
import { useEffect, useMemo, useState } from 'react'
import { fetchForecast, type Forecast } from '../../api/openMeteo'
import type { SpotPrefs } from '../../backend'
import { FEATURES } from '../../config/env'
import type { Spot } from '../../data/spots'
import { useWhatsApp, maskPhone } from '../../hooks/useWhatsApp'
import { enablePush, pushState, type PushState } from '../../lib/push'
import { DegreePicker } from './DegreePicker'
import { alpha, brand } from '../../theme'
import {
  DAYPART_LABEL,
  DEFAULT_PREFS,
  describeMatch,
  findMatches,
  TIDE_LABEL,
  WIND_PREF_LABEL,
  type DayPart,
  type TideState,
} from '../../../supabase/functions/_shared/core/prefs.ts'
import { localNow } from '../../../supabase/functions/_shared/core/time.ts'

const m1 = (v: number) => `${v.toFixed(1).replace('.', ',')} m`

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
      {hint && (
        <Typography variant="caption" sx={{ opacity: 0.65, display: 'block', mb: 0.5 }}>
          {hint}
        </Typography>
      )}
      {children}
    </Box>
  )
}

/** Condições preferidas de um pico favorito, com prévia das janelas da previsão que batem. */
export function PrefsDialog({
  open,
  spot,
  initial,
  initialNotify,
  isFavorite,
  onClose,
  onSave,
  onRemove,
}: {
  open: boolean
  spot: Spot
  initial: SpotPrefs | null
  initialNotify: boolean
  isFavorite: boolean
  onClose: () => void
  onSave: (prefs: SpotPrefs, notify: boolean) => Promise<void>
  onRemove: () => Promise<void>
}) {
  const [p, setP] = useState<SpotPrefs>(initial ?? DEFAULT_PREFS)
  const [notify, setNotify] = useState(initialNotify)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forecast, setForecast] = useState<{ spot: string; f: Forecast } | null>(null)
  const [push, setPush] = useState<PushState | null>(null)
  const wa = useWhatsApp().status
  const set = <K extends keyof SpotPrefs>(k: K, v: SpotPrefs[K]) => setP((x) => ({ ...x, [k]: v }))

  useEffect(() => {
    if (!open) return
    let alive = true
    fetchForecast(spot.lat, spot.lon)
      .then((f) => alive && setForecast({ spot: spot.id, f }))
      .catch(() => {})
    void pushState().then((s) => alive && setPush(s))
    return () => {
      alive = false
    }
  }, [open, spot])

  const f = forecast?.spot === spot.id ? forecast.f : null
  const matches = useMemo(() => (f ? findMatches(spot, f.hours, p, localNow().hour, 13) : null), [f, spot, p])
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      if (notify && push === 'off') setPush(await enablePush())
      await onSave(p, notify)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: '24px' } } }}>
      <DialogTitle sx={{ fontWeight: 800, pb: 0.5 }}>Seu gosto em {spot.name}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
          Avisamos quando a previsão dos próximos dias bater com essas condições. Depois, só se algo mudar: se a janela mudar, se sair (dizendo o motivo) ou se voltar. Se nada mudar, não mandamos nada.
        </Typography>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}

          <Section title={`Tamanho: ${m1(p.minWave)} a ${m1(p.maxWave)}`} hint="Altura das séries na arrebentação deste pico (já considera a direção e o período da ondulação)">
            <Slider
              value={[p.minWave, p.maxWave]}
              min={0.3}
              max={3.5}
              step={0.1}
              onChange={(_, v) => {
                const [a, b] = v as number[]
                setP((x) => ({ ...x, minWave: a, maxWave: b }))
              }}
              valueLabelDisplay="auto"
              valueLabelFormat={m1}
              color="success"
              disableSwap
              getAriaLabel={(i) => (i ? 'Altura máxima' : 'Altura mínima')}
            />
          </Section>

          <DegreePicker
            label="Direção da ondulação"
            hint="De onde vem o swell, em graus (180° = vem do sul). Está no card do pico, ao lado do tamanho."
            value={p.swellDir}
            tol={p.swellDirTol}
            defaultValue={Math.round(spot.facing / 5) * 5}
            onChange={(v, t) => setP((x) => ({ ...x, swellDir: v, swellDirTol: t }))}
          />

          <Section
            title={`Período do swell: ${p.minPeriod} a ${p.maxPeriod ?? 'sem limite'}${p.maxPeriod != null ? ' s' : ''}`}
            hint="Período maior = onda com mais força e mais organizada"
          >
            <Slider
              value={[p.minPeriod, p.maxPeriod ?? 20]}
              min={4}
              max={20}
              step={1}
              onChange={(_, v) => {
                const [a, b] = v as number[]
                setP((x) => ({ ...x, minPeriod: a, maxPeriod: b >= 20 ? null : b }))
              }}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => (v >= 20 ? 'sem limite' : `${v} s`)}
              color="success"
              disableSwap
              getAriaLabel={(i) => (i ? 'Período máximo' : 'Período mínimo')}
            />
          </Section>

          <Section
            title={`Potência da onda: ${p.minPower ?? 0} a ${p.maxPower ?? 'sem limite'}${p.maxPower != null ? ' kJ' : ''}`}
            hint="A mesma Força do card do pico, em kJ por onda e metro de crista: até 100 fraca · 400 moderada · 1000 forte · acima, muito forte"
          >
            <Slider
              value={[p.minPower ?? 0, p.maxPower ?? 1500]}
              min={0}
              max={1500}
              step={25}
              onChange={(_, v) => {
                const [a, b] = v as number[]
                setP((x) => ({ ...x, minPower: a <= 0 ? null : a, maxPower: b >= 1500 ? null : b }))
              }}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => (v >= 1500 ? 'sem limite' : `${v} kJ`)}
              color="success"
              disableSwap
              getAriaLabel={(i) => (i ? 'Potência máxima' : 'Potência mínima')}
            />
          </Section>

          <Section title="Vento">
            <ToggleButtonGroup
              exclusive
              value={p.windDir != null ? 'graus' : 'tipo'}
              onChange={(_, v) => v && setP((x) => ({ ...x, windDir: v === 'graus' ? ((spot.facing + 180) % 360 / 5 | 0) * 5 : null }))}
              size="small"
              sx={{ mb: 1, '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 700, borderRadius: '10px !important', m: 0.25, border: `1px solid ${alpha(brand.purple, 0.2)} !important` } }}
            >
              <ToggleButton value="tipo">Por tipo (terral, lateral…)</ToggleButton>
              <ToggleButton value="graus">Por direção em graus</ToggleButton>
            </ToggleButtonGroup>
            {p.windDir == null ? (
              <ToggleButtonGroup
                exclusive
                value={p.wind}
                onChange={(_, v) => v && set('wind', v)}
                size="small"
                sx={{ display: 'flex', flexWrap: 'wrap', '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 700, borderRadius: '10px !important', m: 0.25, border: `1px solid ${alpha(brand.purple, 0.2)} !important` } }}
              >
                {(Object.keys(WIND_PREF_LABEL) as SpotPrefs['wind'][]).map((k) => (
                  <ToggleButton key={k} value={k}>
                    {WIND_PREF_LABEL[k]}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            ) : (
              <DegreePicker
                label="Direção do vento"
                hint={`De onde o vento sopra, em graus. Para este pico, terral vem de cerca de ${(spot.facing + 180) % 360}°.`}
                value={p.windDir}
                tol={p.windDirTol}
                defaultValue={(spot.facing + 180) % 360}
                anyLabel="Qualquer"
                onChange={(v, t) => setP((x) => ({ ...x, windDir: v, windDirTol: t }))}
                color={brand.plum}
              />
            )}
            <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 700 }}>
              Velocidade do vento: {p.minWind > 0 ? `${p.minWind} a ` : 'até '}
              {p.maxWind} km/h
            </Typography>
            <Slider
              value={[p.minWind, p.maxWind]}
              min={0}
              max={40}
              step={1}
              onChange={(_, v) => {
                const [a, b] = v as number[]
                setP((x) => ({ ...x, minWind: a, maxWind: Math.max(b, 5) }))
              }}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v} km/h`}
              color="success"
              disableSwap
              getAriaLabel={(i) => (i ? 'Vento máximo' : 'Vento mínimo')}
            />
          </Section>

          <Section title="Maré" hint="Nenhuma marcada = qualquer maré">
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
              {(Object.keys(TIDE_LABEL) as TideState[]).map((t) => (
                <Chip
                  key={t}
                  label={TIDE_LABEL[t]}
                  onClick={() => set('tide', toggle(p.tide, t))}
                  color={p.tide.includes(t) ? 'primary' : 'default'}
                  variant={p.tide.includes(t) ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>
          </Section>

          <Section title="Horário">
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
              {(Object.keys(DAYPART_LABEL) as DayPart[]).map((d) => (
                <Chip
                  key={d}
                  label={DAYPART_LABEL[d]}
                  onClick={() => set('dayParts', toggle(p.dayParts, d))}
                  color={p.dayParts.includes(d) ? 'primary' : 'default'}
                  variant={p.dayParts.includes(d) ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>
          </Section>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Avisar com até {p.daysAhead} {p.daysAhead === 1 ? 'dia' : 'dias'} de antecedência
              </Typography>
              <Slider value={p.daysAhead} min={1} max={7} step={1} marks onChange={(_, v) => set('daysAhead', v as number)} color="success" aria-label="Antecedência do aviso" />
            </Box>
          </Stack>

          {/* prévia */}
          <Box sx={{ p: 2, borderRadius: '16px', bgcolor: alpha(brand.green, 0.1) }}>
            <Typography sx={{ fontWeight: 800, mb: 0.5 }}>
              {!matches
                ? 'Conferindo a previsão…'
                : matches.length
                  ? `Nos próximos 14 dias, ${matches.length} ${matches.length === 1 ? 'dia bate' : 'dias batem'} com seu gosto:`
                  : 'Nenhum dia dos próximos 14 bate com essas condições.'}
            </Typography>
            {matches?.slice(0, 6).map((m) => (
              <Typography key={m.start} variant="body2">
                • {describeMatch(m)}
              </Typography>
            ))}
          </Box>

          <Box>
            <FormControlLabel
              control={<Switch checked={notify} onChange={(e) => setNotify(e.target.checked)} color="success" />}
              label={<Typography sx={{ fontWeight: 700 }}>Me avisar quando bater</Typography>}
            />
            {notify && push === 'denied' && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                As notificações do navegador estão bloqueadas para o OlhaOnda. Você ainda verá os avisos no sino do site; para receber
                no celular, libere as notificações nas configurações do navegador.
              </Alert>
            )}
            {notify && push === 'unsupported' && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Este navegador não aceita notificações. Os avisos aparecem no sino do site. No iPhone, adicione o OlhaOnda à tela de
                início para receber.
              </Alert>
            )}
            {notify && FEATURES.whatsapp && (
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.85, mt: 0.5 }}>
                <ChatBubble width={14} height={14} />
                {wa.phone && wa.enabled ? (
                  <>WhatsApp ligado: avisos também chegam em {maskPhone(wa.phone)}.</>
                ) : (
                  <>
                    Quer receber no WhatsApp?{' '}
                    <Box component={RouterLink} to="/meus-picos#whatsapp" onClick={onClose} sx={{ color: brand.plum, fontWeight: 800 }}>
                      Ligue em Meus picos
                    </Box>
                  </>
                )}
              </Typography>
            )}
            {notify && push === 'off' && (
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.75 }}>
                <Bell width={14} height={14} /> Ao salvar, o navegador vai pedir permissão para mostrar notificações.
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
        {isFavorite && (
          <Button
            color="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await onRemove()
                onClose()
              } finally {
                setBusy(false)
              }
            }}
            sx={{ mr: 'auto' }}
          >
            Tirar dos favoritos
          </Button>
        )}
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" disabled={busy} onClick={() => void submit()}>
          {isFavorite ? 'Salvar' : 'Favoritar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
