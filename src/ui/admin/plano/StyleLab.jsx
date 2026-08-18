import { PALETAS, useEstilo, limpiarMateriales } from './estilo'
import { limpiarGeometrias } from './geo'

/**
 * El laboratorio de estilo.
 *
 * Existe para calibrar ANTES de modelar los otros espacios. Si el bisel, la
 * rugosidad o la saturación se afinan mueble por mueble, para el tercer cuarto
 * ya no hay un estilo: hay tres. Aquí se mueve un deslizador y responde la
 * escena entera, y cuando el resultado convence, esos números se vuelven el
 * default del sistema.
 *
 * Bisel y tono invalidan la caché de geometría porque van horneados en los
 * vértices; el resto solo toca materiales.
 */
const Barra = ({ label, valor, min, max, paso = 0.01, onChange, sufijo = '' }) => (
  <label className="block">
    <span className="flex justify-between text-[10.5px] text-cream-3">
      {label}
      <span className="tabular-nums text-cream-2">
        {typeof valor === 'number' ? valor.toFixed(2) : valor}
        {sufijo}
      </span>
    </span>
    <input
      type="range"
      min={min}
      max={max}
      step={paso}
      value={valor}
      onChange={(ev) => onChange(Number(ev.target.value))}
      className="w-full accent-[var(--color-ember)]"
    />
  </label>
)

export default function StyleLab({ onCerrar }) {
  const e = useEstilo()

  const set = (parche, rehacerGeo = false) => {
    if (rehacerGeo) limpiarGeometrias()
    limpiarMateriales()
    e.set(parche)
  }

  return (
    <aside className="w-[15rem] shrink-0 overflow-y-auto border-l border-line bg-ink-2 px-3 py-3">
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] tracking-[0.12em] text-cream-3 uppercase">Style Lab</p>
        <button onClick={onCerrar} className="text-[11px] text-cream-3 hover:text-ember">
          cerrar
        </button>
      </div>
      <p className="mt-1 text-[10.5px] leading-snug text-cream-3">
        Calibra aquí antes de modelar los demás espacios. Lo que quede se vuelve el default del sistema.
      </p>

      <p className="mt-3 text-[9.5px] tracking-[0.1em] text-cream-3 uppercase">Paleta del cuarto</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {Object.entries(PALETAS).map(([id, p]) => (
          <button
            key={id}
            onClick={() => set({ paleta: id })}
            className={`flex items-center gap-1 rounded-full border px-2 py-1 text-[10.5px] transition-colors ${
              e.paleta === id ? 'border-ember text-ember' : 'border-line text-cream-3 hover:border-cream/40'
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.dominante }} />
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2.5 border-t border-line pt-3">
        <p className="text-[9.5px] tracking-[0.1em] text-cream-3 uppercase">Geometría</p>
        <Barra label="Bisel" valor={e.bisel} min={0.01} max={0.12} paso={0.005} onChange={(v) => set({ bisel: v }, true)} />
        <Barra label="Variación tonal" valor={e.tono} min={0} max={0.4} onChange={(v) => set({ tono: v }, true)} />
      </div>

      <div className="mt-3 space-y-2.5 border-t border-line pt-3">
        <p className="text-[9.5px] tracking-[0.1em] text-cream-3 uppercase">Materiales</p>
        <Barra label="Rugosidad" valor={e.rugosidad} min={0.2} max={1} onChange={(v) => set({ rugosidad: v })} />
        <Barra label="Metálico" valor={e.metalico} min={0} max={0.4} onChange={(v) => set({ metalico: v })} />
        <Barra label="Saturación" valor={e.saturacion} min={0.3} max={1.6} onChange={(v) => set({ saturacion: v })} />
      </div>

      <div className="mt-3 space-y-2.5 border-t border-line pt-3">
        <p className="text-[9.5px] tracking-[0.1em] text-cream-3 uppercase">Luz</p>
        <Barra label="Intensidad" valor={e.luzIntensidad} min={0.2} max={2} onChange={(v) => e.set({ luzIntensidad: v })} />
        <Barra label="Ambiente" valor={e.ambiente} min={0} max={1.5} onChange={(v) => e.set({ ambiente: v })} />
        <Barra label="Suavidad de sombra" valor={e.sombraSuave} min={0.1} max={2} onChange={(v) => e.set({ sombraSuave: v })} />
        <Barra label="Oclusión" valor={e.ao} min={0} max={2.5} onChange={(v) => e.set({ ao: v })} />
        <label className="flex items-center justify-between text-[10.5px] text-cream-3">
          Color de luz
          <input
            type="color"
            value={e.luzColor}
            onChange={(ev) => e.set({ luzColor: ev.target.value })}
            className="h-6 w-14 rounded border border-line bg-ink"
          />
        </label>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-line pt-3">
        <p className="text-[9.5px] tracking-[0.1em] text-cream-3 uppercase">Ver por dentro</p>
        {[
          ['verElectricas', 'Conexiones eléctricas'],
          ['verInalambricas', 'Enlaces inalámbricos'],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => e.set({ [k]: !e[k] })}
            className={`block w-full rounded-lg border px-2 py-1 text-left text-[11px] transition-colors ${
              e[k] ? 'border-ember bg-ember/15 text-ember' : 'border-line text-cream-2 hover:border-cream/40'
            }`}
          >
            {label}
          </button>
        ))}
        <p className="text-[10px] leading-snug text-cream-3">
          Existen siempre; se dibujan cuando se piden. Sirve para enseñarle al cliente qué está pasando en su
          casa sin llenar el plano de líneas.
        </p>
      </div>

      <button
        onClick={() => {
          limpiarGeometrias()
          limpiarMateriales()
          e.reiniciar()
        }}
        className="mt-3 w-full rounded-lg border border-line px-2 py-1.5 text-[11px] text-cream-3 hover:border-ember hover:text-ember"
      >
        Volver a los valores base
      </button>
    </aside>
  )
}
