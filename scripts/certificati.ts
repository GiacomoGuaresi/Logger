/**
 * Crea il certificato HTTPS per la rete di casa (docs/05-esecuzione.md, "HTTPS
 * per la PWA"): senza HTTPS il telefono non installa l'app né tiene la shell
 * senza rete. Usa mkcert, che va installato una volta sul Mac:
 *
 *   brew install mkcert && mkcert -install
 *
 * Il certificato vale per localhost, per gli IP attuali del Mac e per il suo
 * nome sulla rete (`<nome>.local`). Se l'IP cambia, si rilancia. I file stanno
 * in certificati/, fuori da git; vite.config.ts li usa da soli se ci sono.
 *
 * Uso: npm run certificati
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { hostname, networkInterfaces } from 'node:os'

const indirizzi = Object.values(networkInterfaces())
  .flat()
  .filter((i) => i && i.family === 'IPv4' && !i.internal)
  .map((i) => i!.address)
const nomi = ['localhost', '127.0.0.1', ...indirizzi, `${hostname().replace(/\.local$/, '')}.local`]

try {
  execFileSync('mkcert', ['-help'], { stdio: 'ignore' })
} catch {
  console.error('mkcert non è installato. Una volta sola: brew install mkcert && mkcert -install')
  process.exit(1)
}

mkdirSync('certificati', { recursive: true })
execFileSync('mkcert', ['-cert-file', 'certificati/cert.pem', '-key-file', 'certificati/key.pem', ...nomi], {
  stdio: 'inherit',
})
const radice = execFileSync('mkcert', ['-CAROOT'], { encoding: 'utf8' }).trim()
console.log(`\nCertificato per: ${nomi.join(', ')}`)
console.log(`Sul telefono va installata e resa attendibile la radice: ${radice}/rootCA.pem`)
