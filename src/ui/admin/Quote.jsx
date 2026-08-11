import { useMemo } from 'react'
import {
  EMISOR,
  FORMAS_PAGO,
  METODOS_PAGO,
  REGIMENES,
  USOS_CFDI,
  enLetra,
} from '../../content/fiscal'
import { decodeQuote } from '../../content/quoteLink'
import { brand } from '../../content/site'
import Logo from '../Logo'

/**
 * Cotización formal en web.
 *
 * Se pinta ENTERAMENTE desde el paquete que viene en la URL: partidas,
 * totales y topología llegan ya resueltos. Este archivo no importa el
 * catálogo ni el modelo de costos, y esa es la razón — es la única página
 * que un cliente abre, y no debe cargar nuestra estructura de precios.
 *
 * Trae ya armados los campos que pide un CFDI 4.0, pero NO es una factura:
 * el CFDI solo existe cuando un PAC lo timbra. Eso se dice en el pie.
 */

const mxn = (n) =>
  Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

const label = (list, id) => list.find((x) => x.id === id)?.label ?? id ?? '—'

function Row({ k, v, mono }) {
  return (
    <div className="flex gap-2 py-[3px] text-[11.5px]">
      <span className="w-[7.5rem] flex-none text-cream-3">{k}</span>
      <span className={`flex-1 text-cream-2 print:text-neutral-700 ${mono ? 'font-mono' : ''}`}>{v || '—'}</span>
    </div>
  )
}

export default function Quote({ token }) {
  const data = useMemo(() => decodeQuote(token), [token])

  if (!data || data.outdated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-6 text-center">
        <div>
          <p className="display text-2xl text-cream">
            {data?.outdated ? 'Esta cotización es de una versión anterior' : 'Esta cotización no se pudo abrir'}
          </p>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-cream-3">
            {data?.outdated
              ? 'El formato del enlace cambió y este ya no trae las partidas. Vuelve a generarla desde el levantamiento y se arregla.'
              : 'El enlace está incompleto o se cortó al copiarlo. Pídenos que te lo mandemos de nuevo.'}
          </p>
          <a href="#/" className="mt-5 inline-block rounded-full border border-line px-4 py-2 text-[13px] text-cream-2">
            Ir al sitio
          </a>
        </div>
      </div>
    )
  }

  const { cliente, obra, rooms, lineas, totales, folio, fecha, vigencia, topologia, aps, garantia, demo } = data

  const emitida = new Date(fecha ?? Date.now())
  const vence = new Date(emitida)
  vence.setDate(vence.getDate() + vigencia)
  const fmt = (d) => d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-ink py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-5 flex max-w-[880px] items-center gap-3 px-5 print:hidden">
        <a href="#/" className="flex items-center gap-2 text-cream">
          <Logo size={18} spin={false} />
          <span className="display text-[15px]">{brand.name}</span>
        </a>
        <span className="text-[11px] text-cream-3">Cotización {folio}{demo ? " · ejemplo" : ""}</span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => navigator.clipboard?.writeText(location.href)}
            className="rounded-lg border border-line px-3 py-1.5 text-[12px] text-cream-2 transition-colors hover:border-cream/40"
          >
            Copiar enlace
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-ember px-3 py-1.5 text-[12px] font-medium text-ink transition-colors hover:bg-ember-2"
          >
            Imprimir / PDF
          </button>
        </div>
      </div>

      {demo && (
        <div className="mx-auto mb-3 max-w-[880px] px-5">
          <p className="rounded-xl border border-ember/35 bg-ember/10 px-4 py-2.5 text-[12px] leading-relaxed text-cream-2">
            <strong className="text-ember">Cotización de ejemplo.</strong> Cliente, domicilio y RFC son
            ficticios, y las tarifas son de demostración. Sirve para ver cómo llega el documento a un
            cliente real.
          </p>
        </div>
      )}

      <article className="mx-auto max-w-[880px] rounded-2xl border border-line bg-ink-2 p-7 print:max-w-none print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-5">
          <div>
            <div className="flex items-center gap-2.5 text-cream print:text-black">
              <Logo size={26} spin={false} />
              <span className="display text-[22px]">{brand.name}</span>
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-cream-2 print:text-neutral-700">
              {EMISOR.razonSocial}
              <br />
              RFC {EMISOR.rfc} · {EMISOR.regimenLabel}
              <br />
              {EMISOR.domicilio} · C.P. {EMISOR.cp}
              <br />
              {EMISOR.email} · {EMISOR.tel}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] tracking-[0.16em] text-cream-3 uppercase">Cotización</p>
            <p className="display text-[26px] text-cream print:text-black">{folio}</p>
            <p className="mt-1 text-[11.5px] text-cream-2 print:text-neutral-700">
              Emitida {fmt(emitida)}
              <br />
              Vigente hasta <strong className="text-ember print:text-black">{fmt(vence)}</strong>
              <br />
              Moneda MXN · Tipo I (Ingreso)
            </p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-line py-5 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[10px] tracking-[0.14em] text-cream-3 uppercase">Cliente</p>
            <Row k="Nombre" v={cliente.nombre} />
            <Row k="Razón social" v={cliente.razonSocial} />
            <Row k="RFC" v={cliente.rfc} mono />
            <Row k="Régimen" v={label(REGIMENES, cliente.regimen)} />
            <Row k="C.P. fiscal" v={cliente.cp} mono />
            <Row k="Uso del CFDI" v={label(USOS_CFDI, cliente.usoCfdi)} />
          </div>
          <div>
            <p className="mb-2 text-[10px] tracking-[0.14em] text-cream-3 uppercase">Obra y pago</p>
            <Row k="Domicilio" v={cliente.direccion} />
            <Row k="Propiedad" v={`${obra.tipo} · ${obra.m2} m² · ${obra.niveles} nivel${obra.niveles > 1 ? 'es' : ''}`} />
            <Row
              k="Habitaciones"
              v={`${rooms.length} espacio${rooms.length === 1 ? '' : 's'} intervenido${rooms.length === 1 ? '' : 's'}`}
            />
            <Row k="Forma de pago" v={label(FORMAS_PAGO, cliente.formaPago)} />
            <Row k="Método" v={label(METODOS_PAGO, cliente.metodoPago)} />
            <Row k="Contacto" v={[cliente.email, cliente.tel].filter(Boolean).join(' · ')} />
          </div>
        </section>

        <section className="py-5">
          <p className="mb-3 text-[10px] tracking-[0.14em] text-cream-3 uppercase">Conceptos</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-[11.5px]">
              <thead>
                <tr className="border-b border-line text-[9.5px] tracking-[0.1em] text-cream-3 uppercase">
                  <th className="py-2 pr-2 font-medium">Clave SAT</th>
                  <th className="py-2 pr-2 font-medium">Cant.</th>
                  <th className="py-2 pr-2 font-medium">Unidad</th>
                  <th className="py-2 pr-2 font-medium">Descripción</th>
                  <th className="py-2 pr-2 text-right font-medium">P. unitario</th>
                  <th className="py-2 text-right font-medium">Importe</th>
                </tr>
              </thead>
              <tbody>
                {lineas.map((l, i) => (
                  <tr key={i} className="border-b border-line/60 align-top">
                    <td className="py-2 pr-2 font-mono text-[10.5px] text-cream-3">{l.k}</td>
                    <td className="py-2 pr-2 tabular-nums text-cream-2 print:text-neutral-700">{l.q}</td>
                    <td className="py-2 pr-2 font-mono text-[10.5px] text-cream-3">{l.x}</td>
                    <td className="py-2 pr-2">
                      <div className="text-cream print:text-black">{l.c}</div>
                      {l.s && <div className="text-[10.5px] text-cream-3">{l.s}</div>}
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums text-cream-2 print:text-neutral-700">{mxn(l.p)}</td>
                    <td className="py-2 text-right tabular-nums text-cream print:text-black">{mxn(l.i)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex justify-end">
            <dl className="w-full max-w-[19rem] space-y-1 text-[12px]">
              <div className="flex justify-between">
                <dt className="text-cream-3">Suma de partidas</dt>
                <dd className="tabular-nums text-cream-2 print:text-neutral-700">{mxn(totales.bruto)}</dd>
              </div>
              {totales.desc > 0 && (
                <div className="flex justify-between text-ember-2 print:text-black">
                  <dt>Descuento{totales.acredita ? ' (incluye levantamiento acreditado)' : ''}</dt>
                  <dd className="tabular-nums">−{mxn(totales.desc)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-1">
                <dt className="text-cream-3">Subtotal</dt>
                <dd className="tabular-nums text-cream-2 print:text-neutral-700">{mxn(totales.sub)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-cream-3">IVA trasladado 16%</dt>
                <dd className="tabular-nums text-cream-2 print:text-neutral-700">{mxn(totales.iva)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-2">
                <dt className="text-[13px] text-cream print:text-black">Total</dt>
                <dd className="display text-[21px] text-ember print:text-black">{mxn(totales.tot)}</dd>
              </div>
            </dl>
          </div>

          <p className="mt-3 border-t border-line pt-3 text-[11px] text-cream-2 print:text-neutral-700">
            <span className="text-cream-3">Importe con letra: </span>
            {enLetra(totales.tot)}
          </p>
        </section>

        <section className="border-t border-line py-5">
          <p className="mb-3 text-[10px] tracking-[0.14em] text-cream-3 uppercase">Alcance por espacio</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {rooms.map((r, i) => (
              <div key={i} className="rounded-lg border border-line px-3 py-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-[12.5px] text-cream print:text-black">{r.n}</span>
                  <span className="text-[11px] text-cream-3">
                    {r.m} m² · {r.t}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-cream-2 print:text-neutral-700">{r.u ?? 0} dispositivos</div>
              </div>
            ))}
          </div>

          {topologia && (
            <div className="mt-3 rounded-lg border border-line px-3 py-2.5 text-[11.5px] text-cream-2 print:text-neutral-700">
              <span className="text-cream-3">Topología: </span>
              {topologia}
              {aps > 0 && ` · ${aps} access point${aps > 1 ? 's' : ''}`}
            </div>
          )}
        </section>

        <section className="border-t border-line py-5 text-[11.5px] leading-relaxed text-cream-2 print:text-neutral-700">
          <p className="mb-2 text-[10px] tracking-[0.14em] text-cream-3 uppercase">Condiciones</p>
          <ul className="space-y-1.5">
            <li>· Precios en pesos mexicanos. Vigencia de {vigencia} días naturales a partir de la emisión.</li>
            <li>· Anticipo del 60% para liberar la compra de equipo; 40% contra entrega y pruebas con el cliente presente.</li>
            <li>· Incluye {garantia} meses de garantía en mano de obra y ajustes de escenas. La garantía del equipo es la del fabricante.</li>
            <li>· No incluye obra civil, resanes, pintura ni cambios en el centro de carga, salvo que aparezcan como partida.</li>
            <li>· El equipo de importación está sujeto a existencias y tipo de cambio al momento de la orden de compra.</li>
            <li>· Cualquier dispositivo que el cliente aporte se instala, pero su compatibilidad no forma parte de la garantía.</li>
          </ul>
        </section>

        <footer className="border-t border-line pt-4 text-[10.5px] leading-relaxed text-cream-3">
          <p>
            <strong className="text-cream-2 print:text-black">Este documento es una cotización, no un comprobante fiscal.</strong>{' '}
            Los datos fiscales aquí capturados son los que se usarán para emitir el CFDI 4.0
            correspondiente una vez confirmado el pedido. El CFDI se timbra a través de un PAC
            autorizado por el SAT y es ese documento —con folio fiscal (UUID), sello digital y cadena
            original— el que ampara la operación.
          </p>
          <p className="mt-2">
            Verifica que tu RFC, razón social, régimen fiscal y código postal coincidan exactamente con
            tu Constancia de Situación Fiscal: son la causa más común de rechazo al timbrar.
          </p>
        </footer>
      </article>
    </div>
  )
}
