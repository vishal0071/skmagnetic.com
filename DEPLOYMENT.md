# Deploying skmagnetic.com

The site runs on the **same server as galleryflow**, behind galleryflow's existing **Traefik**, which already handles
ports 80/443 and free HTTPS certificates. Two extra containers are added. **Nothing in galleryflow changes.** The
server gets the code straight from GitHub: **https://github.com/vishal0071/skmagnetic.com** (public, no keys needed).

```
Internet ─▶ Traefik (galleryflow, :80/:443)
              ├─ galleryflow web / app / api                        (unchanged)
              ├─ skmagnetic.com/admin, /api/  ─▶ skmagnetic-admin  (admin panel, enquiries, site builder)
              └─ skmagnetic.com, www (301)    ─▶ skmagnetic-web    (nginx, the website)
```

**Where things live on the server** (in `~/skmagnetic.com`):

| Folder | Contents | In git? |
|---|---|---|
| code (everything except `live/`) | website, admin, Docker setup | ✅ — updated with `git pull` |
| `live/content/` | pages, settings and photos edited in the admin | ❌ — never touched by git |
| `live/data/` | enquiries and the SEO report | ❌ — never touched by git |
| `.env` | admin password and settings | ❌ |

On first start, `live/content/` is filled from the repository. After that, only pages that are new in the repository are
added; admin edits are never overwritten, and pages deleted in the admin don't come back.

---

## First-time setup

### 1. Point the domain at the server (DNS)

At your domain registrar, add two **A records** pointing to the galleryflow server's IP:

| Name | Type | Value |
|---|---|---|
| `@` (skmagnetic.com) | A | `<server IP>` |
| `www` | A | `<server IP>` |

Check from your computer; both should print the server IP (this can take a few minutes to an hour):
```bash
dig +short skmagnetic.com
dig +short www.skmagnetic.com
```

### 2. On the server: check galleryflow is running

```bash
ssh ubuntu@<server-ip>
docker network ls | grep galleryflow     # expect: galleryflow_galleryflow
docker ps | grep traefik                 # Traefik must be running
```

Galleryflow must run in **production mode**, which is what issues the HTTPS certificates. In the galleryflow folder:
`docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`

### 3. On the server: get the code

```bash
cd ~
git clone https://github.com/vishal0071/skmagnetic.com.git
cd skmagnetic.com
```

### 4. On the server: create `.env` (the admin login)

```bash
cat > .env <<EOF
ADMIN_USER=admin
ADMIN_PASSWORD=<choose a strong password, 12+ characters>
ADMIN_SECRET=$(openssl rand -hex 32)
SITE_DOMAIN=skmagnetic.com
TRAEFIK_NETWORK=galleryflow_galleryflow
CERT_RESOLVER=le
EOF
chmod 600 .env
```

Optional: to get an email for every new enquiry, also add `NOTIFY_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS` and `SMTP_FROM` (see `.env.example`).

### 5. On the server: start it

```bash
docker compose up -d --build
docker compose ps        # both containers "running"; admin becomes "healthy" after its first build
```

Traefik picks the containers up automatically and issues the HTTPS certificate within about a minute.

### 6. Check it works

```bash
curl -I https://skmagnetic.com              # HTTP/2 200
curl -I https://www.skmagnetic.com          # 301 → https://skmagnetic.com/
curl https://skmagnetic.com/api/health      # {"ok":true,"release":"..."}
```

Then open **https://skmagnetic.com/admin** and log in with the username and password from step 4.

---

## Update the site after code changes

On your computer, push the changes to GitHub (`git push`). Then on the server:

```bash
ssh ubuntu@<server-ip>
cd ~/skmagnetic.com
./scripts/update.sh
```

`update.sh` does `git pull`, then rebuilds and restarts both containers, and the admin rebuilds the website. Your admin
edits and enquiries in `live/` are not affected.

Or in one line from your computer:
```bash
ssh ubuntu@<server-ip> 'cd ~/skmagnetic.com && ./scripts/update.sh'
```

---

## Add your real data, then switch SEO on (in the admin)

Until you go live, **Google is completely blocked**:
- every page is `noindex, nofollow`
- `robots.txt` blocks all search engines
- the sitemap is empty

The admin header shows **"● Hidden from Google"**.

1. **Company & contact:** enter the real phone, WhatsApp, email (tick "confirmed"), address, city, PIN, GSTIN and hours.
2. **Products** (and the other sections): review each page, upload real photos, then untick **Sample content**.
3. **Company & contact:** add the Google Tag Manager or GA4 ID and the Search Console verification code.
4. Press **Publish changes** and check the website.
5. When everything is real: tick **"Website is LIVE"**, then **Publish changes**. The badge turns green: **"● Live on Google"**.
6. In Google Search Console, submit `https://skmagnetic.com/sitemap.xml`.

---

## Day-to-day

| Task | How |
|---|---|
| Change content, prices, contact details | Admin → edit → **Publish changes** |
| Undo a bad publish | Admin → **Publish & history** → *Restore this version* |
| Deploy code changes | `git push`, then on the server `./scripts/update.sh` |
| Save live content to GitHub | On your computer: `DEPLOY_HOST=ubuntu@<server-ip> ./scripts/pull-content.sh`, then `git add src/content && git commit -m "Update content" && git push` |
| View logs | **server:** `cd ~/skmagnetic.com && docker compose logs --tail=50` |
| Restart | **server:** `docker compose restart` |
| Stop | **server:** `docker compose down` |

**Backups:** copy `~/skmagnetic.com/live/` regularly, for example together with galleryflow's backups. It holds all
pages, settings, photos and enquiries. The code is safe on GitHub. No database is needed.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `network … not found` | Run `docker network ls`, put the correct name in `TRAEFIK_NETWORK` in `.env`, then `docker compose up -d` |
| Browser shows a certificate error | DNS doesn't point to the server yet, or galleryflow isn't running with `docker-compose.prod.yml` |
| `Missing .env` / `Set ADMIN_PASSWORD in .env` | Do step 4 |
| Admin container keeps restarting | `ADMIN_PASSWORD` must be 10+ characters and `ADMIN_SECRET` must be set. Check `docker compose logs admin` |
| 404 from Traefik | The containers aren't on galleryflow's network. Check `docker compose ps` and `docker network inspect galleryflow_galleryflow` |
| `git pull` fails with "local changes" | Someone edited code files directly on the server. Run `git status` to see them; `git checkout -- <file>` discards them (`live/` is never affected) |
| Publish failed | Admin → **Publish & history** shows the build log. The live site is unchanged until a publish succeeds |
| Enquiry emails not arriving | Check the SMTP settings in `.env`, then run `docker compose up -d` |

### Alternative: deploy without git on the server
`DEPLOY_HOST=ubuntu@<server-ip> ./scripts/deploy.sh` (run on your computer) copies the code over SSH instead of using
`git pull`. It needs `.env` on the server (step 4). Use one method or the other, not both.
