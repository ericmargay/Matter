import { useState } from 'react'
import Section from './Section'
import Reveal from './Reveal'
import { contact, brand } from '../content/site'

const field =
  'w-full rounded-xl border border-line bg-ink px-4 py-3.5 text-[14px] text-cream placeholder:text-cream-3 transition-colors duration-300 focus:border-ember focus:outline-none'

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    type: contact.types[0],
    message: '',
  })

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  /**
   * Sin backend todavía: el formulario arma el mensaje y lo abre en WhatsApp.
   * Es lo que de verdad usa el cliente para contestar, y evita montar un
   * servidor solo para reenviar cinco campos por correo.
   */
  const onSubmit = (e) => {
    e.preventDefault()
    const text = [
      `Hola ${brand.name}, quiero agendar un levantamiento.`,
      '',
      `Nombre: ${form.name}`,
      `Correo: ${form.email}`,
      `Espacio: ${form.type}`,
      form.message && `Me gustaría automatizar: ${form.message}`,
    ]
      .filter(Boolean)
      .join('\n')

    window.open(`${brand.whatsappUrl}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  return (
    <Section id="contacto">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <Reveal>
          <p className="eyebrow mb-4">{contact.eyebrow}</p>
          <h2 className="display text-[clamp(2.25rem,5.5vw,4.25rem)]">{contact.title}</h2>
          <p className="lede mt-5 max-w-[40ch]">{contact.body}</p>

          <div className="mt-12 space-y-5 border-t border-line pt-8">
            <a
              href={brand.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-6 text-[15px] text-cream transition-colors duration-300 hover:text-ember"
            >
              <span className="text-cream-3">WhatsApp</span>
              <span className="flex items-center gap-2">
                {brand.whatsapp}
                <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                  →
                </span>
              </span>
            </a>
            <a
              href={`mailto:${brand.email}`}
              className="group flex items-center justify-between gap-6 text-[15px] text-cream transition-colors duration-300 hover:text-ember"
            >
              <span className="text-cream-3">Correo</span>
              <span className="flex items-center gap-2">
                {brand.email}
                <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">
                  →
                </span>
              </span>
            </a>
            <div className="flex items-center justify-between gap-6 text-[15px]">
              <span className="text-cream-3">Zona</span>
              <span className="text-cream">{brand.city}</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-ink-2 p-7 md:p-9">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-[11px] tracking-[0.14em] text-cream-3 uppercase">
                  {contact.fields.name}
                </span>
                <input required value={form.name} onChange={set('name')} className={field} placeholder="Tu nombre" />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] tracking-[0.14em] text-cream-3 uppercase">
                  {contact.fields.phone}
                </span>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  className={field}
                  placeholder="55 0000 0000"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] tracking-[0.14em] text-cream-3 uppercase">
                  {contact.fields.email}
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  className={field}
                  placeholder="tu@correo.com"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-[11px] tracking-[0.14em] text-cream-3 uppercase">
                  {contact.fields.type}
                </span>
                <select value={form.type} onChange={set('type')} className={field}>
                  {contact.types.map((t) => (
                    <option key={t} value={t} className="bg-ink">
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-[11px] tracking-[0.14em] text-cream-3 uppercase">
                  {contact.fields.message}
                </span>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={set('message')}
                  className={`${field} resize-none`}
                  placeholder="Las luces de la sala, la persiana de la recámara, que la casa sepa cuándo llego…"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-7 w-full rounded-full bg-ember py-4 text-[14px] font-medium text-ink transition-colors duration-400 hover:bg-ember-2"
            >
              {contact.submit}
            </button>
            <p className="mt-3 text-center text-[11px] text-cream-3">{contact.alt}</p>
          </form>
        </Reveal>
      </div>
    </Section>
  )
}
