# skmagnetic.com — SK Enterprises

Lead-generation website and admin panel for **SK Enterprises**, manufacturer of industrial magnetizers
(magnet charging machines), magnetizing coils and fixtures — Maharashtra, India.

- **Website:** static [Astro](https://astro.build) site. About 6 KB of JavaScript, a self-hosted font, and SEO and structured data built in.
- **Admin panel** (`/admin`): edit settings and content, upload photos, receive enquiries, read the SEO report, and publish.

```bash
npm install
npm run dev                 # website with live reload → http://localhost:4321
npm run admin               # admin panel → http://localhost:8787/admin  (needs .env, see below)
npm run build               # static site → dist/
npm run check:site          # SEO & link audit of dist/
npm run check:placeholders  # launch checklist
npm run assets              # regenerate logo files, favicons and the social share image
```

---

## Admin panel

| Section | What you can do |
| --- | --- |
| **Dashboard** | Launch checklist, new enquiries, last publish |
| **Enquiries** | Every website form submission (with attachments). Call, WhatsApp or email the customer; set a status (new, in progress, quoted, closed); export CSV |
| **Products, Categories, Industries, Applications, Blog** | Edit every page: Google title and description (with length counters), text, specifications, FAQs, related links and photos. Create and delete pages |
| **Company & contact** | Phone, WhatsApp, email, address, map, hours, GSTIN, social links, Google Analytics / Tag Manager, Search Console code, and the **launch switch** |
| **Trust & process** | "Why choose us" points, "How we work" steps, testimonials, certificates and client logos |
| **SEO report** | Every page's Google title and description, broken links, pages hidden from Google, placeholders left |
| **Publish & history** | Rebuild the live site (takes seconds) and restore an earlier version with one click |

How it works: edits are saved to `src/content/` (Markdown and JSON). **Publish changes** runs the Astro build. It then switches
the live site to the new version in one atomic step, so visitors never see a half-built page, and keeps the last 5 versions.
If a build fails, the live site doesn't change and the error log is shown.

The website's enquiry form posts to `/api/enquiry`, which is served by the admin service. Enquiries are stored on the server
(`data/enquiries/`) and, if SMTP is configured, emailed to `NOTIFY_EMAIL`. If the API can't be reached, the form offers
one-tap WhatsApp or email with everything the visitor typed, so no lead is lost.

**Security:**
- Single admin login (`ADMIN_USER` / `ADMIN_PASSWORD`) with signed, expiring, HttpOnly, SameSite=Strict cookies.
- Login attempts are rate-limited.
- Requests from other sites are blocked (Origin check).
- Strict Content-Security-Policy.
- Uploads are checked by file content and size.
- Enquiry attachments are only downloadable by the admin.
- The admin is served over HTTPS by Traefik and is `noindex`.

**Local:** `cp .env.example .env`, then set `ADMIN_PASSWORD`, `ADMIN_SECRET` (`openssl rand -hex 32`) and `SERVE_SITE=1`.
Run `npm run admin` and open http://localhost:8787. The published site and the admin share one origin, so the enquiry form works.

---

## ⚠️ Before launch

The site starts in **safe pre-launch mode**. The admin **Dashboard** shows the checklist (also `npm run check:placeholders`).

1. **Company & contact:** real phone, WhatsApp, email (tick "confirmed"), full address with city and PIN, map, hours, GSTIN.
2. **Content:** every page was written as a starting point and is marked **sample** (hidden from Google). Review each page with
   the engineering team. Replace the `{{…}}` placeholders (models, energy ratings, warranty, lead time, installation…), then
   untick "Sample content".
3. **Photos:** upload real machine photos on each product page. Until then, built-in illustrations are shown.
4. **Analytics:** add the Google Tag Manager ID (or GA4 ID) and the Search Console verification code.
5. **Trust:** add only genuine testimonials, certificates and client logos (with permission).
6. **Policies:** complete the four policy pages (`src/pages/*.md`) and have them reviewed by a legal adviser.
7. **Go live:** tick **"Website is LIVE"** in Company & contact → Publish. Then submit
   `https://skmagnetic.com/sitemap.xml` in Google Search Console.

**Placeholders and review mode:** text in `{{double braces}}` is something SK Enterprises still has to confirm. Visitors never
see it: the sentence reads as finished and missing values show sensible fallbacks (e.g. spec tables say "On request").
Open any page with **`?review=1`** to highlight every placeholder and "sample" notice; `?review=0` turns this off.

**Content rule:** never publish invented facts — specifications, prices, certifications, clients, reviews, years in business or
capacity. Leave a `{{placeholder}}` until the real information is known.

---

## SEO

### Built in
- Every page has a unique `<title>`, meta description and H1 (the SEO report and `npm run check:site` verify this). Clean URLs, canonical tags, Open Graph and Twitter cards.
- `sitemap.xml` lists confirmed pages only. `robots.txt` blocks everything until the site is set to LIVE, and always blocks `/admin` and `/api`.
- Structured data:
  - Organization, with `knowsAbout` for the industry
  - WebSite and BreadcrumbList
  - Product, with SK Enterprises as manufacturer and offers only if a real price is set
  - FAQPage, with placeholder answers excluded
  - BlogPosting and CollectionPage
  - LocalBusiness, emitted once the full address is entered
- Keyword map from Google India research. Each page targets its own phrase:
  - home: "magnetizer manufacturer in India"
  - machines category: "magnetizer machine"
  - products: "magnet charging machine", "capacitor discharge / impulse magnetizer", "rotor magnetizing machine", "speaker magnetizer machine", "magnetizing coil / fixture / yoke"
  - articles: magnet charging machine price, radial vs axial magnetization, BLDC fan rotor magnetizing
- Fast: static HTML, minimal JS, AVIF/WebP images, a preloaded font and long-cache assets.

### What decides ranking from here (off-site — do these after launch)
Research showed most Indian magnetizer makers exist **only on IndiaMART**, and only one Pune competitor has a real website.
A well-structured site can therefore rank, but Google also weighs trust signals that live outside the website:

1. **Google Business Profile:** create or verify the profile with the exact same name, address and phone as the website. Add photos, the products and the website link, and ask satisfied customers for reviews. This drives "near me" and map results.
2. **IndiaMART, then TradeIndia and ExportersIndia:**
   - These dominate the search results for these terms. Create listings for each machine (magnet charging machine, speaker magnetizer, rotor magnetizer, magnetizing coil/fixture) with specs and photos.
   - Link each listing to the matching product page.
   - Keep the business name, address and phone identical everywhere.
3. **Search Console:** verify, submit the sitemap, and watch the "Queries" report. Add FAQs and articles for questions people actually search.
4. **Real photos and short videos** of machines working. No Indian competitor has video, and buyers search "how does a magnetizer work".
5. **Specifications buyers filter on:** energy (J/kJ), maximum voltage, input supply, cycle time and warranty, per model, in the "Models & supply" table.
6. **Links from industry sources:** supplier listings with customers, associations, trade-show exhibitor pages, and local business directories.
7. **Keep publishing helpful articles:** one or two a month, e.g. a Hindi/Hinglish "magnet charge kaise hota hai" guide or e-rickshaw/hub motor magnet recharging. Each should link to the relevant product.

No one can guarantee a #1 position. These steps, done consistently, are what move rankings for commercial terms like these.

---

## Deployment — same server as galleryflow

Two containers run on the galleryflow server, behind galleryflow's existing **Traefik** (ports 80/443, Let's Encrypt
resolver `le`, network `galleryflow_galleryflow`). **Nothing in galleryflow changes.**

```
Internet ─▶ Traefik (galleryflow, :80/:443)
              ├─ galleryflow web / app / api                        (unchanged)
              ├─ skmagnetic.com/admin, /api/  ─▶ skmagnetic-admin  (Node: admin, enquiries, builder)
              └─ skmagnetic.com, www (301)    ─▶ skmagnetic-web    (nginx: /srv/site/current)
```

**One-time setup**
1. DNS: A records for `skmagnetic.com` and `www.skmagnetic.com` pointing to the galleryflow server's IP.
2. galleryflow must be running in production mode (`docker-compose.prod.yml`). Check the network name with
   `docker network ls | grep galleryflow`.
3. On the server, in `~/skmagnetic.com`: `cp .env.example .env`, then set `ADMIN_PASSWORD` and `ADMIN_SECRET`. Optionally set SMTP and `NOTIFY_EMAIL` for enquiry emails.

**Deploy or update code** (from your machine):

```bash
DEPLOY_HOST=ubuntu@<server-ip> ./scripts/deploy.sh
```

The script builds and audits locally, uploads the code, then runs `docker compose up -d --build` on the server. On start, the
admin service rebuilds the site, so code changes go live automatically.

**Content lives on the server once you use the admin.** The deploy script only *adds* content files that don't exist on the
server yet; it never overwrites admin edits. Before changing content locally, run
`DEPLOY_HOST=… ./scripts/pull-content.sh` to download the live content.

Data on the server:
- `~/skmagnetic.com/src/content/`: pages, settings and uploaded photos
- `~/skmagnetic.com/data/`: enquiries and the SEO report
- the `skmagnetic_site` Docker volume: published versions

Back up the first two folders together with galleryflow's backups.

---

## Project structure

```
admin/                    Admin service (Hono + Node): server.mjs, lib/, public/
src/content/
  settings.json           Company & contact, analytics, launch switch   (admin → Company & contact)
  trust.json              Why choose us, process, testimonials…        (admin → Trust & process)
  products/ categories/ industries/ applications/ blog/   Markdown pages (admin → content sections)
  media/                  Uploaded photos
src/pages/                Routes, policies, sitemap.xml, robots.txt
src/components/ layouts/ styles/   Design system and templates
scripts/                  Assets, audits, deploy and pull-content
Dockerfile                nginx image (website)
Dockerfile.admin          Node image (admin)
docker-compose.yml        Both services + Traefik labels
deploy/nginx.conf         Clean URLs, caching, 404
public/brand/             Logo files (SVG/PNG, light and dark)
```

### Adding a product without the admin
Create `src/content/products/<url-slug>.md` by copying an existing product. The file name becomes the URL. Cross-references
(category, related products, industries…) are validated at build time, so a typo fails the build instead of shipping a broken
link.

## Analytics events (GTM / GA4)

| Event | Fired when |
| --- | --- |
| `generate_lead` | Enquiry form sent (or sent via the WhatsApp/email fallback) |
| `quote_request` | A quote form is sent |
| `product_enquiry` | A form is sent with a product selected |
| `whatsapp_click` · `phone_click` · `email_click` | WhatsApp, `tel:` or `mailto:` links |
| `cta_click` | Get a Quote / Enquire buttons |
| `view_item` | Product page view |
| `file_download` | Datasheet download |

In GA4, mark `generate_lead`, `quote_request`, `whatsapp_click` and `phone_click` as key events.

## Brand

`public/brand/` holds the logo: the **S⚡K mark** (S and K as two magnetic poles with a charging pulse between them) and the
**SK ENTERPRISES** wordmark with "Magnetizer Manufacturer", as SVG (outlined, renders everywhere) and PNG. Regenerate with
`npm run assets` after editing `scripts/brand.mjs`.
