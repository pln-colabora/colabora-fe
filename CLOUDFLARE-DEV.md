# Cloudflare Workers — dev

Dev URL: <https://colabora-dev.bimorajendraa.workers.dev/login>.
Initial deployment used the pushed `dev` source, without building `main`.
GitHub repository `pln-colabora/colabora-fe` is connected to Workers Builds with
production branch `dev`, automatic builds enabled, and previews disabled.
The dedicated user build token has only Workers Scripts: Edit and Account
Settings: Read within the selected Cloudflare account.

Workers Free was selected instead of Pages to retain the existing Next.js dynamic
routes. The Worker name is `colabora-dev`. Hosting setup does not change pages,
API contracts, or workflow rules.

## Tooling and deployment

Use Node.js **24.22.1** (`.node-version`) and npm **11.21.1** (`packageManager`). Original Next.js scripts remain
available; vinext is an additional Workers build path with matching React/RSC
versions and the official Cloudflare Vite plugin/CLI.

```sh
npm ci
npm run dev:vinext
npm run build:vinext
npm run start:vinext
npm run typecheck
git switch dev
npm run deploy:vinext -- --dry-run
npm run deploy:vinext
```

The deploy script refuses branches other than `dev`, targets `colabora-dev`,
disables automatic resource provisioning, and builds with
`NEXT_PUBLIC_API_BASE_URL=https://api-colabora.anargya.fun`. It leaves `.env.local`
unchanged. `--prebuilt` uploads previously verified build output. The guard also
checks `WORKERS_CI_BRANCH` for Workers Builds' detached checkouts.

Connect GitHub repository `pln-colabora/colabora-fe` using these Workers Builds
settings:

| Setting | Value |
| --- | --- |
| Production branch | `dev` |
| Build command | `npm run build:vinext` |
| Deploy command | `npm run deploy:vinext -- --prebuilt` |
| Root directory | Repository root |
| Build variable | `NEXT_PUBLIC_API_BASE_URL=https://api-colabora.anargya.fun` |
| Deployment account variable | `CLOUDFLARE_ACCOUNT_ID=c5a8765fe4efb1e9ec3ce5b0ee6f1091` |
| Non-production branch builds | Disabled |

Pushes to `dev` should trigger the connected build. Do not enable `main` builds
or create an additional GitHub Actions deployment workflow.

`typecheck` regenerates Next.js route types because both builders share
`.next/types`. Generated output and local environment files stay ignored.

CLI OAuth requests account-read, Workers-script read/write, and Workers CI
read/write permissions. CI access manages the GitHub build connection; the
dedicated deployment token retains the narrower permissions listed above.
Credentials are encrypted with the Windows keyring; never commit tokens or paste
them into chat. MCP and CLI authorization are separate. Installed Codex skills
are available on the next turn; restart the agent to load the new MCP server.

## Scope and verification

The backend remains the existing Go/PostgreSQL service. Its health check passes,
but `/api/pdkb/schedules` returns 404 and its OpenAPI does not yet list the new
priority, revision, or working-day SLA contracts. The backend `dev` changes and
migrations must reach that service before the new features work online. Frontend
deployment does not update that backend.

82 frontend tests, lint, typecheck, and the original Next.js Webpack build passed.
Workers build, deployment dry-run and initial upload passed: 105 assets, approximately 873 KiB
gzip for the Worker, and static assets as the only binding. Local and online
runtime checks verified login and dynamic routes with HTTP 200. The online login
page rendered with no captured browser errors. Backend CORS preflight returned
204 with the dev origin permitted. No production data was created by these checks. No cache,
database, image service, or other paid resource is configured.

The dependency audit reports existing and toolchain advisories, including the
retained Next.js package and PDF dependencies. No forced audit fix, framework
downgrade, or unrelated refactor was applied. Review these separately before
treating this development deployment as a production release.

## Official references

- [Agent setup](https://developers.cloudflare.com/agent-setup/prompt.md)
- [Next.js on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Workers Free limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [vinext migration](https://github.com/cloudflare/vinext/blob/main/.agents/skills/migrate-to-vinext/SKILL.md)

Free-plan quotas apply, including 100,000 Worker requests/day and 10 ms CPU per
request. This setup does not purchase a plan or change account billing.
