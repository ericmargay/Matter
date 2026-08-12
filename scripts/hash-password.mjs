#!/usr/bin/env node
/**
 * Genera el hash de una contraseña para PANEL_USERS.
 *
 *   npm run hash-password -- margay
 *
 * Pide la contraseña sin mostrarla en pantalla y escupe la línea lista para
 * pegar en las variables de entorno de Railway. La contraseña en claro nunca
 * se guarda en ningún lado.
 */
import crypto from 'node:crypto'
import readline from 'node:readline'

const usuario = (process.argv[2] ?? '').toLowerCase().trim()
if (!usuario) {
  console.error('Uso: npm run hash-password -- <usuario>')
  process.exit(1)
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })

// eco apagado: la contraseña no debe quedar en el historial visible
const escribir = rl._writeToOutput
rl._writeToOutput = function (s) {
  if (rl.stdoutMuted) rl.output.write('')
  else escribir.call(rl, s)
}

process.stdout.write(`Contraseña para "${usuario}": `)
rl.stdoutMuted = true

rl.question('', (contrasena) => {
  rl.stdoutMuted = false
  rl.close()
  console.log()

  if (contrasena.length < 10) {
    console.error('\nMuy corta. Mínimo 10 caracteres.')
    process.exit(1)
  }

  const sal = crypto.randomBytes(16)
  const hash = crypto.scryptSync(contrasena, sal, 32)
  console.log(`\n${usuario}:scrypt$${sal.toString('base64')}$${hash.toString('base64')}\n`)
  console.log('Pega eso en PANEL_USERS. Si hay varios usuarios, sepáralos con coma.')
})
