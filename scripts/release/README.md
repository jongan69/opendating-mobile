# release/ — portable RN launch pipeline

Drop this directory into any React Native / Expo repo. Everything project-specific
lives in `release.config.json`; no other file needs editing.

```
release/
  release.config.json     the only file you edit
  ship.sh                 orchestrator
  lib/
    verify-ipa.mjs        prove an archive is App Store signed
    buy-domain.mjs        register a domain via Namecheap
    scaffold-landing.mjs  generate an Astro landing site + blog
    generate-articles.mjs generate the SEO article set with the Claude API
```

## Usage

```bash
./release/ship.sh --dry-run          # print the plan, touch nothing
./release/ship.sh                    # run every enabled stage
./release/ship.sh --only ios-build   # one stage
./release/ship.sh --skip seo,domain  # all but these
./release/ship.sh -m "custom commit message"
```

Stages: `cleanup commit verify push domain seo blog web ios-build ios-verify
ios-submit android-build android-submit`

Each stage group is gated by `"enabled": true` in the config, so a repo with no
domain or SEO work just leaves those false and the stages never run.

**Start with `--dry-run`.** It resolves the config, prints every command, and
lists the exact 30 article titles it would generate.

## Stage order, and why

`verify` runs before `push`, and `ios-verify` runs before `ios-submit`. Store
build stages additionally require the signed source-candidate gate; submit
stages require the full manifest with artifact IDs, store build numbers, and
checksums. Nothing leaves the machine until tests pass, and no archive is
uploaded until it has been proven App Store signed. A dev-signed IPA fails at
Apple's end *after* a long upload, so checking locally is cheap.

## Environment

Nothing secret is ever read from the config file.

| Stage | Variables |
|---|---|
| `domain` | `NAMECHEAP_API_USER` `NAMECHEAP_API_KEY` `NAMECHEAP_USERNAME` `NAMECHEAP_CLIENT_IP` `NAMECHEAP_ENV` |
| `domain` | `NC_REGISTRANT_FIRST_NAME` `_LAST_NAME` `_ADDRESS1` `_CITY` `_STATE_PROVINCE` `_POSTAL_CODE` `_COUNTRY` `_PHONE` `_EMAIL_ADDRESS` |
| `seo` | `AI_PROVIDER` `AI_API_KEY` `AI_MODEL` (optionally `AI_BASE_URL`) |
| `ios-submit` | EAS credentials (`eas login`), `ASC_API_KEY_PATH` `ASC_API_KEY_ISSUER_ID`, numeric `ascAppId` in `eas.json` |
| `android-submit` | EAS credentials (`eas login`), `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` |

`NC_REGISTRANT_PHONE` must be formatted `+NNN.NNNNNNNNNN` — Namecheap rejects
anything else with error 2015182.

## Things that will bite you

**Namecheap requires IP whitelisting.** The calling IPv4 must be registered under
Profile → Tools → API Access. A laptop on DHCP or a CI runner with rotating egress
will fail intermittently and confusingly. Production API access also has account
requirements that sandbox does not.

**`domains.create` spends money immediately** and registrations are effectively
non-refundable. `NAMECHEAP_ENV` defaults to sandbox; you must set it to
`production` explicitly. `maxPriceUsd` caps what a premium domain can cost you.

**WHOIS privacy defaults to OFF in Namecheap's API**, which publishes the
registrant's home address. `buy-domain.mjs` forces it on unless you set
`domain.whoisPrivacy: false`. Leave it on.

**iOS stages need macOS.** `ship.sh` refuses to run them elsewhere rather than
failing halfway through a build.

**Google Play will not accept an API upload until the package already exists in
the console with one release uploaded by hand.** This is a one-time gate per
app, it is not documented at the point of failure, and `android-submit` will
fail against a package that has never been through it. Do the first upload
through the Play Console UI; every later one can go through this pipeline.

**iOS builds need a distribution certificate before they can run at all.**
A cloud build fails with *"Distribution Certificate is not validated for
non-interactive builds"* and never reaches the queue. Run `eas credentials
--platform ios` interactively once — it needs an Apple Developer login, so it
cannot be part of an automated pipeline.

**iOS submits also need an App Store Connect app record.** Once the record exists
for the bundle ID, run `npm run store:ios:lookup-asc-app-id` with
`ASC_API_KEY_PATH`, `ASC_API_KEY_ISSUER_ID`, and `ASC_API_KEY_ID` available. Run
it again with `-- --write-eas-json` to save the numeric `ascAppId` before
`ios-submit`.

## The blog stage, and why it writes to `public/`

`blog.mode: "expo-public"` (the default) renders articles as **static HTML** into
`public/blog/<slug>/index.html`.

Expo copies `public/` verbatim into the web export, so files written there are
served as direct static HTML without adding application routes or another site.

The upshot: no app-route changes, no second site, and no new dependency.

The stage also regenerates `public/sitemap.xml` (homepage + index + every article)
and writes `public/llms.txt`.

Markdown in the configured `blog.contentDir` is the source of truth and is version-controlled.
Editing an article and re-running `--only blog` re-renders it without calling the
API again. Supported markdown is deliberately narrow — headings, paragraphs,
lists, blockquotes, inline code, links, bold/italic — matching what the generator
is instructed to produce.

Set `blog.mode: "astro"` instead to scaffold a standalone Astro site, for projects
that want the blog on its own domain.

## On the SEO stage

`seo.autoPublish: true` writes every article with `draft: false`, so they go live
on the next deploy.

Two things to know, stated plainly:

Google's spam policy targets *scaled content abuse* — large volumes of pages
produced mainly to rank, whether written by a model or a person. Thirty articles
appearing at once on a new domain fits that description. `generate-articles.mjs`
staggers `pubDate` backwards to avoid a single-instant archive, but that is
cosmetic. Publishing gradually is the real mitigation; set `autoPublish: false`
and release in batches if you want that.

The comparison and alternatives articles make claims about *named third-party
products*. The prompt instructs the model to avoid asserting competitor pricing
and feature specifics it cannot support, and to send readers to the competitor's
own site for current details. That reduces the risk but does not remove it.
Inaccurate published claims about a named company are your liability. Read them.

Re-running the stage skips files that already exist, so a partial failure can be
resumed and individual articles can be regenerated by deleting them.

## Extending

Adding a stage means: add the name to `ALL_STAGES`, add a `should_run <name>`
block, and add a config key. Stages are independent — `--only` must work for any
one of them in isolation.
