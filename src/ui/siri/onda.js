/**
 * La onda de Siri, en un shader.
 *
 * La técnica es la que reconstruyó Neel Dedkawala (MIT) y que Apple usa en el
 * iOS 26: no es un gradiente animado ni un GIF, es geometría de distancia.
 * Merece explicarse porque de otra forma el código de abajo es ilegible:
 *
 * — La forma —la cápsula donde vive la onda— se define por su DISTANCIA. En
 *   vez de dibujar un rectángulo redondeado, cada pixel pregunta "¿a qué
 *   distancia estoy del borde?". Eso da bordes perfectos a cualquier tamaño y,
 *   más importante, da el número con el que se hace todo lo demás: el vidrio,
 *   la refracción y el rebote de la luz en el canto.
 *
 * — La onda no es una: son seis, cada una con su amplitud, su grosor y su
 *   desfase. Una sola se ve a osciloscopio; seis desfasadas se cruzan y se
 *   separan, y ahí aparece el movimiento orgánico que uno reconoce.
 *
 * — Cada onda va metida en un HUSO: `sin(x·π)` elevado a una potencia. Sin eso
 *   las ondas llegarían a los extremos con toda su amplitud y se verían
 *   cortadas por el borde; con el huso nacen y mueren en punta.
 *
 * — Donde varias se encima, el color se va a BLANCO. Ese núcleo caliente es lo
 *   que hace que se lea como luz y no como líneas de colores: la luz que se
 *   suma se satura, y el ojo lo sabe.
 */

export const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const FRAGMENT = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float u_tiempo;
  uniform vec2  u_res;
  uniform float u_abierto;    // 0 cerrado, 1 abierto: cuánto mide la cápsula
  uniform float u_energia;    // qué tan agitada va la onda (escuchando / pensando)
  uniform float u_brillo;
  uniform vec3  u_c1;
  uniform vec3  u_c2;
  uniform vec3  u_c3;
  uniform vec3  u_c4;
  uniform float u_radio;

  const float PI = 3.14159265359;

  /* Distancia con signo a una cápsula: negativa dentro, positiva fuera. Es la
     primitiva de la que cuelga todo lo demás. */
  float sdCapsula(vec2 p, vec2 medio, float r) {
    vec2 d = abs(p) - medio + r;
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
  }

  void main() {
    vec2 px = (vUv - 0.5) * u_res;

    /* La cápsula crece a lo ancho al abrirse, no a lo alto: es lo que hace que
       parezca la barra estirándose desde la isla y no una caja inflándose. */
    float ancho = mix(u_res.x * 0.10, u_res.x * 0.46, u_abierto);
    float alto  = mix(u_res.y * 0.16, u_res.y * 0.30, u_abierto);
    vec2 medio = vec2(ancho, alto);
    float r = min(u_radio, min(medio.x, medio.y));

    float d = sdCapsula(px, medio, r);
    float dentro = 1.0 - smoothstep(-1.5, 1.5, d);
    if (dentro < 0.001) discard;

    float alBorde = -d;                       // positiva hacia adentro
    float banda = max(alto * 0.55, 1.0);
    float zonaBorde = clamp(1.0 - alBorde / banda, 0.0, 1.0);

    /* ── las seis ondas ── */
    float amp[6];   amp[0]=1.30; amp[1]=0.70; amp[2]=1.22; amp[3]=0.72; amp[4]=0.60; amp[5]=0.60;
    float gro[6];   gro[0]=1.35; gro[1]=0.72; gro[2]=1.30; gro[3]=0.75; gro[4]=0.60; gro[5]=0.60;
    float fase[6];  fase[0]=0.0; fase[1]=0.38; fase[2]=0.75; fase[3]=1.15; fase[4]=1.50; fase[5]=1.85;
    vec3  col[6];   col[0]=u_c1; col[1]=u_c2; col[2]=u_c3; col[3]=u_c4; col[4]=u_c1; col[5]=u_c3;

    vec3 suma = vec3(0.0);
    float densidad = 0.0;
    float cruces = 0.0;

    for (int i = 0; i < 6; i++) {
      float fi = float(i);

      /* Cada onda se refracta un poco distinto cerca del canto. Es lo que da
         el destello de colores del borde: dispersión, como en un prisma. */
      float desvio = (fi - 2.5) * 1.6 * zonaBorde * u_abierto;
      vec2 pw = px - vec2(0.0, desvio);

      float nx = (pw.x / (ancho * 1.9)) + 0.5;
      if (nx <= 0.0 || nx >= 1.0) continue;

      // el huso: nace y muere en punta
      float huso = pow(sin(nx * PI), 1.9);
      float bordes = smoothstep(0.0, 0.14, nx) * smoothstep(1.0, 0.86, nx);

      float armonico = 1.0 + 0.14 * sin(u_tiempo * 1.5 + fi * 1.3);
      float a = amp[i] * armonico * huso * alto * 0.42 * (0.35 + u_energia * 0.75);
      float ang = (pw.x / max(ancho, 1.0)) * 7.0;
      float y = sin(ang + u_tiempo * (1.6 + u_energia * 1.4) + fase[i] * 2.2) * a;

      float dist = abs(pw.y + y);
      float grosor = max(alto * 0.09 * gro[i] * huso, 0.6);

      float w = pow(clamp(grosor / (dist + grosor * 0.32), 0.0, 1.0), 1.9) * bordes;
      suma += w * col[i];
      densidad += w;
      cruces += smoothstep(grosor * 2.2, 0.0, dist);
    }

    /* Donde se cruzan tres o más, al blanco. Es lo que lo hace leer como luz y
       no como seis líneas de colores encimadas. */
    if (densidad > 1.5 && cruces >= 2.6) {
      float blanco = smoothstep(1.5, 4.5, densidad);
      suma = mix(suma, vec3(1.35), blanco * 0.85);
    }

    /* El vidrio: un cuerpo apenas visible y un canto que recoge luz. Sin el
       canto la cápsula flota sin volumen; con él parece una pieza de cristal
       encima de la pantalla. */
    vec3 cuerpo = vec3(0.02, 0.03, 0.05) * (1.0 - zonaBorde * 0.4);
    float canto = smoothstep(2.6, 0.0, alBorde) * u_abierto;
    vec3 filo = vec3(0.72, 0.82, 1.0) * canto * 0.5;

    // el menisco de abajo, donde el vidrio hace de lente
    float abajo = clamp((px.y + alto * 0.25) / (alto * 1.25), 0.0, 1.0);
    filo += vec3(0.96, 0.98, 1.0) * smoothstep(3.0, 0.0, alBorde) * abajo * 0.35;

    vec3 rgb = cuerpo + suma * u_brillo + filo;
    gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), dentro);
  }
`

/* Los cuatro colores. Son los de la casa y no los de Apple a propósito: si la
   barra saliera con el degradado de Siri, el cliente vería a Apple en nuestra
   pantalla. Estos son los mismos de la marca, en el mismo orden en que
   aparecen en el resto de la herramienta. */
export const COLORES = {
  c1: '#4d9fff',
  c2: '#8b5cf6',
  c3: '#5eead4',
  c4: '#f0a3c8',
}
