# 04 · Sicurezza

> Durante la prova in locale (Fase 1) l'app girava sul Mac, raggiungibile solo dalla rete di casa e senza passphrase. Dalla Fase 2 valgono le regole qui sotto.

## Supabase

Il progetto è **pubblico** su GitHub e il sito è online: valgono le regole delle altre app: progetto Supabase, account e modo di accesso sono **gli stessi di Grocery, Projects e Trekking**.

### Chiavi e variabili

| Variabile | Dove sta | Pubblica? |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` in locale, *Variables* del repo GitHub in CI | sì, finisce nel bundle |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | stessa gestione | sì, per design: da sola non concede nulla con RLS attiva |
| `VITE_SUPABASE_EMAIL` | stessa gestione | sì: senza passphrase non basta |
| Secret / service role key | **mai nel repo, né nel frontend, né nelle variabili di Actions** | no |
| Password del database | solo in locale, per applicare gli script SQL e copiare i dati | no |

### Autenticazione

- Un solo utente Supabase Auth, condiviso con le altre app.
- L'email è fissata nella build; chi entra scrive solo la **passphrase** (`signInWithPassword`).
- Niente pulsante "Esci", come le altre app.
- **Sessione condivisa**: stessa origine (`giacomoguaresi.github.io`), stesso progetto Supabase e cookie con percorso `/`, quindi chi è dentro un'altra app di casa è dentro anche in Logger.

### Autorizzazione (RLS)

- RLS attiva su ogni tabella dello schema `logger`.
- Policy: `for all to authenticated using (true) with check (true)`.
- `revoke all … from anon`; `grant usage on schema logger to authenticated` e grant sugli oggetti dello schema.

⚠️ Con un progetto condiviso, **qualunque utente autenticato vede tutte le app**. Oggi l'utente è uno solo, quindi va bene.

### Checklist prima di pubblicare

- [ ] Registrazioni pubbliche ancora spente sul progetto (`disable_signup: true`)
- [ ] RLS attiva su ogni tabella dello schema `logger`
- [ ] Una query con la sola publishable key e senza sessione non restituisce righe
- [ ] Nessun file `.env*`, `dati/` (con `logger.db`) né `certificati/` nella storia git prima di renderla pubblica
- [ ] Secret key e password del DB assenti dal repo e dalla storia git
- [ ] URL di redirect di Auth: aggiunto `https://giacomoguaresi.github.io/Logger/`
- [ ] Sessione condivisa verificata: accesso a Grocery → Logger aperto senza passphrase

### Dati sul dispositivo

Cache e coda senza rete stanno nel `localStorage` del browser ([03](03-architettura.md#senza-rete)): chi ha in mano il telefono sbloccato può leggerle. È lo stesso compromesso di Grocery, accettabile per dati di questo tipo.
