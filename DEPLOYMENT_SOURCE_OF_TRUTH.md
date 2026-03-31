# Deployment Source Of Truth

This repository contains a legacy duplicate app under `web/`.

## Active application

Use the repository root as the only active Next.js app:

- `app/`
- `components/`
- `lib/`
- root `package.json`

## Vercel setting (required)

Set **Project Root Directory** to repository root (`/`), not `web/`.

## Why

Client Portal and latest production fixes are implemented in the root app.
Deploying `web/` can miss new features (for example Client Portal toggle in Edit Client).

## Safety guard

`web/package.json` scripts are intentionally disabled so accidental deploys from `web/` fail fast with a clear message.
