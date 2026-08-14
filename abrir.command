#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Abre TODA la superficie de Matter en una ventana, ya con sesión, sin teclear.
#
#   • Doble clic en Finder, o
#   • ./abrir.command                (en la terminal)
#
# Pestañas: sitio público · catálogo del cliente · cotización de ejemplo ·
# proyectos · catálogo de operaciones · proveedores · levantamiento · planta
# completa · y el plano 3D de tres cuartos de TIPOS DISTINTOS, que es donde se
# ve si el acomodo automático se portó bien en cada caso.
#
# Si el servidor local está caído lo LEVANTA solo y espera a que responda.
# Desactívalo con AUTOSTART=0.
#
# El plano 3D y la planta necesitan un proyecto REAL: el script se lo pregunta
# al servidor (/api/estado) y arma los enlaces con los ids que de verdad
# existen. Si todavía no hay ningún plano dibujado, esas dos pestañas se
# saltan y te lo dice, en vez de abrir una pantalla vacía.
#
# Variables:
#   URL         a qué servidor apuntar. Default: se autodetecta el de Vite.
#               Para Railway: URL=https://www.matter.com.mx ./abrir.command
#   USUARIO     con qué socio entrar (margay | carpio). Default margay.
#   CLAVE       contraseña, solo para servidor remoto. Sin ella se abre el
#               login y se saltan las pestañas que necesitan datos.
#   AUTOSTART   1 = levanta el servidor si está caído (default); 0 = no.
#   PLANOS      cuántos planos 3D abrir, uno por tipo de cuarto. Default 3.
#   VENTANA     1 = ventana nueva (default); 0 = pestañas donde caigan.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

REPO="$(cd "$(dirname "$0")" && pwd)"
USUARIO="${USUARIO:-margay}"
AUTOSTART="${AUTOSTART:-1}"
DEV_LOG="/tmp/matter-dev.log"
COOKIES="$(mktemp)"
trap 'rm -f "$COOKIES"' EXIT

# ── ¿dónde está el servidor? ─────────────────────────────────────────────────
#
# No basta con "¿responde el puerto?": Vite contesta 200 a cualquier ruta por
# el fallback de SPA, así que otro proyecto React en un puerto vecino se haría
# pasar por este. El discriminador bueno es /package.json, que Vite sirve de
# verdad y trae el nombre del paquete.
detectar() {
  for port in 5173 5174 5175 5176 5177 3000; do
    nombre=$(curl -s --max-time 1 "http://localhost:$port/package.json" 2>/dev/null \
      | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{process.stdout.write(JSON.parse(d).name||'')}catch(e){}})" 2>/dev/null || true)
    [ "$nombre" = "matter" ] && { echo "http://localhost:$port"; return; }
  done
  # el build de producción no sirve package.json; ahí basta con /salud
  curl -sf --max-time 1 -o /dev/null "http://localhost:3000/salud" 2>/dev/null && { echo "http://localhost:3000"; return; }
  echo ""
}

URL="${URL:-$(detectar)}"

ES_LOCAL=0
case "$URL" in *localhost*|*127.0.0.1*|"") ES_LOCAL=1 ;; esac

if [ -z "$URL" ] && [ "$AUTOSTART" = "1" ]; then
  echo "▸ No encontré el servidor. Lo levanto…"
  ( cd "$REPO" && npm run dev >"$DEV_LOG" 2>&1 & )
  for _ in $(seq 1 40); do
    sleep 1
    URL="$(detectar)"
    [ -n "$URL" ] && break
  done
fi

if [ -z "$URL" ]; then
  echo "✗  No pude levantar el servidor. Mira $DEV_LOG"
  echo "   O apunta a otro:  URL=https://www.matter.com.mx ./abrir.command"
  exit 1
fi

echo "▸ Servidor: $URL"

# ── sesión ───────────────────────────────────────────────────────────────────
#
# En local no hay PANEL_USERS, así que el servidor expone un atajo sin
# contraseña que solo existe cuando NO hay usuarios configurados. En Railway
# esa ruta no está y hay que entrar a mano — el script abre el login.
LOGIN_TAB=""
if [ "$ES_LOCAL" = "1" ]; then
  curl -s -c "$COOKIES" -o /dev/null "$URL/panel/dev-login?u=$USUARIO&volver=/" || true
  if curl -s -b "$COOKIES" "$URL/api/yo" | grep -q '"usuario"'; then
    echo "▸ Sesión: $USUARIO"
    LOGIN_TAB="$URL/panel/dev-login?u=$USUARIO&volver=/"
  else
    echo "▸ Sin sesión automática (¿PANEL_USERS configurado?). Abro el login."
    LOGIN_TAB="$URL/panel/login"
  fi
elif [ -n "${CLAVE:-}" ]; then
  # Con contraseña se puede iniciar sesión por curl y así preguntar por los
  # proyectos reales, que es lo que permite abrir los planos 3D directos.
  # El navegador entra aparte: la primera pestaña es el login.
  curl -s -c "$COOKIES" -o /dev/null -X POST "$URL/panel/login" \
    --data-urlencode "usuario=$USUARIO" --data-urlencode "contrasena=$CLAVE" || true
  if curl -s -b "$COOKIES" "$URL/api/yo" | grep -q '"usuario"'; then
    echo "▸ Sesión remota: $USUARIO"
  else
    echo "▸ La contraseña no fue aceptada; abro el login."
  fi
  LOGIN_TAB="$URL/panel/login"
else
  echo "▸ Servidor remoto: la sesión se inicia a mano en la primera pestaña."
  echo "  (con CLAVE=... también abro los planos 3D directos)"
  LOGIN_TAB="$URL/panel/login"
fi

# ── ¿qué hay adentro? ────────────────────────────────────────────────────────
#
# Los planos 3D solo se pueden abrir si existen, y los ids no se pueden
# adivinar. Se le preguntan al servidor y se eligen cuartos de TIPOS DISTINTOS
# —una recámara, un baño, una oficina— porque el disponedor automático se
# comporta distinto en cada uno y revisar tres recámaras no dice nada nuevo.
PLANOS="${PLANOS:-3}"

DATOS=$(curl -s -b "$COOKIES" "$URL/api/estado" 2>/dev/null | PLANOS="$PLANOS" node "$REPO/scripts/superficie.mjs" 2>/dev/null || true)

PROYECTO=""; NOMBRE=""
CUARTOS=""
while IFS=$'\t' read -r clase a b c; do
  case "$clase" in
    PROYECTO) PROYECTO="$a"; NOMBRE="$b" ;;
    CUARTO)   CUARTOS="${CUARTOS}${a}\t${b} · ${c}\n" ;;
  esac
done <<< "$DATOS"

[ -n "$NOMBRE" ] && echo "▸ Proyecto: $NOMBRE"

# ── las pestañas ─────────────────────────────────────────────────────────────
PESTANAS=""
agregar() { PESTANAS="${PESTANAS}${1}\t${2}\n"; }

agregar "$LOGIN_TAB" "Sesión"

#  lo de cara al cliente
agregar "$URL/#/"                     "Sitio público"
agregar "$URL/#/catalogo"             "Catálogo del cliente"
agregar "$URL/#/cotizacion?d=demo"    "Cotización de ejemplo"

#  operaciones
agregar "$URL/#/admin/proyectos"      "Proyectos"
agregar "$URL/#/admin/catalogo"       "Catálogo de operaciones"
agregar "$URL/#/admin/proveedores"    "Proveedores"

#  el proyecto y sus planos
if [ -n "$PROYECTO" ]; then
  agregar "$URL/#/admin/levantamiento?proyecto=$PROYECTO"          "Levantamiento"
  agregar "$URL/#/admin/levantamiento?proyecto=$PROYECTO&planta=1" "Planta completa"
  while IFS=$'\t' read -r cid etiqueta; do
    [ -z "$cid" ] && continue
    agregar "$URL/#/admin/levantamiento?proyecto=$PROYECTO&plano=$cid" "Plano 3D · $etiqueta"
  done <<< "$(printf '%b' "$CUARTOS")"
else
  agregar "$URL/#/admin/levantamiento" "Levantamiento"
fi

# ── abrir ────────────────────────────────────────────────────────────────────
#
# La primera va en ventana NUEVA y las demás como pestañas suyas: si todas se
# abren "normal" se apilan sobre las ventanas de trabajo que ya tenías y hay
# que ir rescatándolas una por una.
#
# Cuál es el navegador por default se lee de LaunchServices, para no imponerle
# Chrome a quien usa Safari. Si algo de esto falla se cae al `open` de siempre:
# abrir la superficie nunca debe depender de este adorno.
navegador_default() {
  plutil -convert json -o - \
    ~/Library/Preferences/com.apple.LaunchServices/com.apple.launchservices.secure.plist 2>/dev/null \
    | /usr/bin/python3 -c 'import json,sys
try:
    d = json.load(sys.stdin)
    print(next((h.get("LSHandlerRoleAll","") for h in d.get("LSHandlers",[])
                if h.get("LSHandlerURLScheme") == "https"), ""))
except Exception:
    print("")' 2>/dev/null
}

BUNDLE=$(navegador_default)
[ -z "$BUNDLE" ] && BUNDLE="com.apple.safari"

ventana_nueva() {
  local url="$1"
  [ "${VENTANA:-1}" = "0" ] && { open "$url" 2>/dev/null; return; }
  case "$BUNDLE" in
    com.google.chrome*|com.brave.browser*|com.microsoft.edgemac*|com.vivaldi*|company.thebrowser*)
      open -b "$BUNDLE" -n --args --new-window "$url" 2>/dev/null && return ;;
    org.mozilla.firefox*)
      open -b "$BUNDLE" -n --args -new-window "$url" 2>/dev/null && return ;;
    com.apple.safari)
      osascript -e 'tell application "Safari"
        activate
        make new document with properties {URL:"'"$url"'"}
      end tell' >/dev/null 2>&1 && return ;;
  esac
  open "$url" 2>/dev/null || true
}

echo
PRIMERA=1
N=0
while IFS=$'\t' read -r url label; do
  [ -z "$url" ] && continue
  echo "   →  $label"
  if [ "$PRIMERA" = "1" ]; then
    ventana_nueva "$url"
    PRIMERA=0
    # la ventana nueva tarda en tomar el foco; sin esta pausa las pestañas
    # siguientes se van a la ventana anterior
    sleep 1.6
  else
    open "$url" 2>/dev/null || true
    sleep 0.35
  fi
  N=$((N+1))
done <<< "$(printf '%b' "$PESTANAS")"

echo
echo "✅  $N pestañas abiertas."
[ -z "$PROYECTO" ] && echo "    (sin proyectos: crea uno en Operaciones)"
[ -n "$PROYECTO" ] && [ -z "$CUARTOS" ] && echo "    (sin planos 3D: usa \"Generar planos\" en el levantamiento)"
echo "    Más planos:      PLANOS=6 ./abrir.command"
echo "    Otro socio:      USUARIO=carpio ./abrir.command"
echo "    Contra Railway:  URL=https://www.matter.com.mx ./abrir.command"
