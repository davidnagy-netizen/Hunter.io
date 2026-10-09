# Email setup

Fundor sends two emails, both with a 6-digit code (valid 10 minutes, one use, burnt after 5 wrong tries):

| Email | When | Code is entered on |
| --- | --- | --- |
| **E-mail-cím megerősítése** (`App\Notifications\VerifyAccountEmail`) | After registration, and on "Új kód küldése" | `/verify-email` |
| **Jelszó visszaállítása** (`App\Notifications\PasswordResetCode`) | "Elfelejtetted a jelszavad?" on the sign-in page | `/forgot-password` |

Both are Laravel notifications put on the **database queue** (`QUEUE_CONNECTION=database`) and sent by the configured **mailer**.
Each email is written in **Hungarian or English**: the language the site was in when the user registered, pressed
"Új kód küldése" or asked for a password reset (`?lang=en`; Hungarian otherwise).

## Now: no SMTP yet (placeholder)

`.env` ships with `MAIL_MAILER=log`: an email is not sent, it is written to `storage/logs/laravel.log`. To test a flow
before SMTP exists, run a queue worker and read the code from the log:

```bash
php artisan queue:work --stop-when-empty
# the latest code in the log:
grep -oE 'letter-spacing: 8px[^>]*>[0-9]{6}' storage/logs/laravel.log | tail -1 | grep -oE '[0-9]{6}$'
```

## Going live: real emails

### 1. Sender and service (decided)

- Sender: **`noreply@fundor.hu`**, display name **Fundor**. These are the defaults in `.env.example`.
- Service: **Zoho ZeptoMail** (transactional email). The sending domain and its DNS (SPF, DKIM, DMARC) are already
  set up and verified in ZeptoMail.

### 2. Get the SMTP credentials from ZeptoMail

In ZeptoMail open **Mail Agents → (the Fundor agent) → SMTP**. It shows the host, the port, the username and the
password (the agent's *Send Mail token*). Zoho documents `smtp.zeptomail.com`; an account in another data center may
show a different host (e.g. `smtp.zeptomail.eu`). Copy exactly what the SMTP page shows.

### 3. Fill in `.env` on the server

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.zeptomail.com    # as shown on the agent's SMTP page
MAIL_PORT=587                   # STARTTLS; see the Hetzner note below
MAIL_USERNAME=emailapikey       # ZeptoMail's SMTP username
MAIL_PASSWORD=...               # the agent's Send Mail token — never commit it
MAIL_FROM_ADDRESS="noreply@fundor.hu"
MAIL_FROM_NAME="Fundor"
```

`MAIL_SCHEME` can stay `null`: port 587 uses STARTTLS. The From address must be on the domain verified in ZeptoMail.

> **Hetzner:** new Hetzner Cloud servers block outgoing ports **25 and 465** by default. Use **587**, or ask Hetzner
> support to unblock the port.

Then reload the configuration:

```bash
php artisan config:clear      # and `php artisan config:cache` if the server caches config
```

### 4. Keep a queue worker running

> **Open:** who sets up and runs the worker on the VPS is not decided yet. The verification flow can't be launched
> reliably until it is.

Emails wait in the `jobs` table until a worker sends them. Without a worker nothing goes out.

- **systemd / Supervisor** (preferred): run `php artisan queue:work --tries=3` as a permanent service and restart it
  after every deploy (`php artisan queue:restart`).
- **cPanel without a service manager**: a cron job every minute,
  `* * * * * cd /path/to/app && php artisan queue:work --stop-when-empty --tries=3 >/dev/null 2>&1`.

### 5. Test

1. Use "Elfelejtetted a jelszavad?" with your own address, or register a test company.
2. The email should arrive within a minute (check spam too).
3. If it doesn't: `php artisan queue:failed` lists failed sends with the SMTP error; `storage/logs/laravel.log` has
   details. After fixing `.env`, run `php artisan config:clear` and `php artisan queue:retry all`.
