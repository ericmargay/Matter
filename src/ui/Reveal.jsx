import { useEffect, useRef, useState } from 'react'

/**
 * Aparición al entrar en pantalla.
 * IntersectionObserver en vez de una librería de animación: son 20 líneas
 * y evita meter 30 kB al bundle para hacer un fade.
 */
export default function Reveal({ children, as: Tag = 'div', delay = 0, y = 20, className = '', ...rest }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : `translateY(${y}px)`,
        transition: `opacity .9s var(--ease-out-expo) ${delay}s, transform .9s var(--ease-out-expo) ${delay}s`,
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
