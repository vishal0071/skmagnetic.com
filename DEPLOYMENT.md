# Deploying skmagnetic.com

The site runs on the **same server as galleryflow**, behind galleryflow's existing **Traefik**, which already handles
ports 80/443 and free HTTPS certificates. Two extra containers are added. **Nothing in galleryflow changes.**

```
Internet ─▶ Traefik (galleryflow, :80/:443)
              ├─ galleryflow web / app / api                        (unchanged)
              ├─ skmagnetic.com/admin, /api/  ─▶ skmagnetic-admin  (admin panel, enquiries, site builder)
              └─ skmagnetic.com, www (301)    ─▶ skmagnetic-web    (nginx, the website)
```

**What you need**
- SSH access to the galleryflow server (for example `ubuntu@<server-ip>`)
- Access to the domain's DNS settings
- This project on your Mac with `npm install` done

Commands marked **Mac** run on your computer. Commands marked **server** run after `ssh ubuntu@<server-ip>`.

---

## 1. Point the domain at the server (DNS)

At your domain registrar, add two **A records** pointing to the galleryflow server's IP:

| Name | Type | Value |
|---|---|---|
| `@` (skmagnetic.com) | A | `<server IP>` |
| `www` | A | `<server IP>` |

**Mac** — wait until both print the server IP. This can take a few minutes to an hour.
```bash
dig +short skmagnetic.com
dig +short www.skmagnetic.com
```

## 2. Check the server (server)

```bash
ssh ubuntu@<server-ip>
docker network ls | grep galleryflow     # expect: galleryflow_galleryflow
docker ps | grep traefik                 # Traefik must be running
which rsync || sudo apt install -y rsync
```

Galleryflow must be running in **production mode**, which is what issues the HTTPS certificates:
`docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d` (run in the galleryflow folder).

## 3. Create the admin login (server)

```bash
mkdir -p ~/skmagnetic.com && cd ~/skmagnetic.com
cat > .env <<EOF
ADMIN_USER=admin
ADMIN_PASSWORD=<choose a strong password, 12+ characters>
ADMIN_SECRET=$(openssl rand -hex 32)
SITE_DOMAIN=skmagnetic.com
TRAEFIK_NETWORK=galleryflow_galleryflow
CERT_RESOLVER=le
EOF
chmod 600 .env
exit
```

Optional: to get an email for every new enquiry, also add `NOTIFY_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASS` and `SMTP_FROM` (see `.env.example`).

## 4. Deploy (Mac, in the project folder)

One time only, if SSH still asks for a password:
```bash
ssh-copy-id ubuntu@<server-ip>
```

Then deploy:
```bash
cd ~/Documents/Project/skmagnetic.com
DEPLOY_HOST=ubuntu@<server-ip> ./scripts/deploy.sh
```

The script:
1. Builds and checks the site on your Mac. It stops if there are broken links or SEO problems.
2. Uploads the code to `~/skmagnetic.com` on the server.
3. Starts the `skmagnetic-web` and `skmagnetic-admin` containers.

The admin then builds the website on the server. Traefik picks the containers up automatically and issues the
HTTPS certificate within about a minute.

## 5. Check it works

**Mac**
```bash
curl -I https://skmagnetic.com              # HTTP/2 200
curl -I https://www.skmagnetic.com          # 301 → https://skmagnetic.com/
curl https://skmagnetic.com/api/health      # {"ok":true,"release":"..."}
```

Open **https://skmagnetic.com/admin** and log in with the username and password from step 3.

**server** — logs, if something looks wrong:
```bash
cd ~/skmagnetic.com && docker compose ps && docker compose logs --tail=50
```

## 6. Add your real data, then switch SEO on (in the admin)

Until you go live, **Google is completely blocked**:
- every page is `noindex, nofollow`
- `robots.txt` blocks all search engines
- the sitemap is empty

The admin header shows **"● Hidden from Google"**, so it is safe to deploy early.

1. **Company & contact:** enter the real phone, WhatsApp, email (tick "confirmed"), address, city, PIN, GSTIN and hours.
2. **Products** (and the other sections): review each page, upload real photos, then untick **Sample content**.
3. **Company & contact:** add the Google Tag Manager or GA4 ID and the Search Console verification code.
4. Press **Publish changes** and check the website.
5. When everything is real: tick **"Website is LIVE"**, then **Publish changes**. The badge turns green: **"● Live on Google"**.
6. In Google Search Console, submit `https://skmagnetic.com/sitemap.xml`.

---

## Later

| Task | How |
|---|---|
| Change content, prices, contact details | Admin → edit → **Publish changes** |
| Undo a bad publish | Admin → **Publish & history** → *Restore this version* |
| Deploy code changes | **Mac:** `DEPLOY_HOST=ubuntu@<server-ip> ./scripts/deploy.sh` (never overwrites admin edits) |
| Copy live content back to your Mac | **Mac:** `DEPLOY_HOST=ubuntu@<server-ip> ./scripts/pull-content.sh` (do this before editing content files locally) |
| Save live content to GitHub | After pull-content: `git add src/content && git commit -m "Update content" && git push` |
| Restart | **server:** `cd ~/skmagnetic.com && docker compose restart` |
| Stop | **server:** `cd ~/skmagnetic.com && docker compose down` |

**Backups:** copy these two folders on the server regularly, for example together with galleryflow's backups:
- `~/skmagnetic.com/src/content/` — pages, settings and photos
- `~/skmagnetic.com/data/` — enquiries

No database is needed.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `network … not found` | Run `docker network ls` on the server, put the correct name in `TRAEFIK_NETWORK` in `.env`, then deploy again |
| Browser shows a certificate error | DNS doesn't point to the server yet, or galleryflow isn't running with `docker-compose.prod.yml` |
| `Missing .env on the server` | Do step 3 |
| Admin container keeps restarting | `.env` is missing `ADMIN_PASSWORD` (10+ characters) or `ADMIN_SECRET`. Check `docker compose logs admin` |
| 404 from Traefik | The containers aren't on galleryflow's network. Check `docker compose ps` and `docker network inspect galleryflow_galleryflow` |
| Publish failed | Admin → **Publish & history** shows the build log. The live site is unchanged until a publish succeeds |
| Enquiry emails not arriving | Check the SMTP settings in `.env`, then run `docker compose up -d` |
