#!/usr/bin/env bash
#
# Deploy this quickstart to Google Cloud Run from source.
#
# This repo is PUBLIC and ships with NO deploy-specific configuration: there are
# no baked-in project ids, service accounts, or secrets. You run this script
# against YOUR OWN GCP project and it supplies your credentials to Cloud Run at
# runtime as environment variables.
#
# What it does:
#   1. Reads your app config from .env.local (or the current shell env).
#   2. Builds the container from the Dockerfile via Cloud Build.
#   3. Deploys it to Cloud Run, passing your config as runtime env vars.
#
# Prerequisites:
#   - gcloud CLI installed and authenticated:  gcloud auth login
#   - A GCP project with billing enabled.
#   - APIs enabled (the script enables them for you):
#       run.googleapis.com, cloudbuild.googleapis.com, artifactregistry.googleapis.com
#
# Usage:
#   ./deploy/cloud-run.sh
#
# Configure via environment variables (all optional except the project):
#   GCP_PROJECT   GCP project id      (default: your active `gcloud config` project)
#   GCP_REGION    Cloud Run region    (default: us-central1)
#   SERVICE       Cloud Run service   (default: snh-ai-quickstart)
#   ENV_FILE      App env file to load (default: .env.local)
#
# Example:
#   GCP_PROJECT=my-project GCP_REGION=us-east1 ./deploy/cloud-run.sh

set -euo pipefail

# --- Resolve config ---------------------------------------------------------
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

GCP_PROJECT="${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null || true)}"
GCP_REGION="${GCP_REGION:-us-central1}"
SERVICE="${SERVICE:-snh-ai-quickstart}"
ENV_FILE="${ENV_FILE:-.env.local}"

if [[ -z "$GCP_PROJECT" || "$GCP_PROJECT" == "(unset)" ]]; then
  echo "ERROR: No GCP project set. Pass GCP_PROJECT=... or run: gcloud config set project <id>" >&2
  exit 1
fi

echo "==> Project: $GCP_PROJECT"
echo "==> Region:  $GCP_REGION"
echo "==> Service: $SERVICE"

# --- Enable required APIs (idempotent) --------------------------------------
echo "==> Ensuring required APIs are enabled..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project "$GCP_PROJECT"

# --- Collect runtime env vars from ENV_FILE ---------------------------------
# These are the keys the app understands (see .env.example). We only forward the
# ones that are actually set, and write them to a temp YAML so values containing
# commas, slashes, or other special characters are passed safely.
APP_ENV_KEYS=(
  API_BASE_URL
  AUTH_CLIENT_ID
  AUTH_CLIENT_SECRET
  AUTH_DOMAIN
  AUTH_AUDIENCE
  AUTH_TOKEN
  WEBHOOK_SECRET
  PUBLIC_BASE_URL
  PUBLIC_RECORDS_API_BASE_URL
  PUBLIC_RECORDS_API_KEY
  PUBLIC_RECORDS_TOKEN
  # Optional shared-password gate for the hosted demo (see middleware.ts). Set
  # BOTH to require a username/password before the UI is accessible.
  BASIC_AUTH_USER
  BASIC_AUTH_PASSWORD
)

# Load ENV_FILE into this shell (without leaking to child processes) if present.
if [[ -f "$ENV_FILE" ]]; then
  echo "==> Loading app config from $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  echo "==> $ENV_FILE not found; using values from the current shell environment."
fi

ENV_YAML="$(mktemp -t cloudrun-env.XXXXXX.yaml)"
trap 'rm -f "$ENV_YAML"' EXIT

wrote_any=false
for key in "${APP_ENV_KEYS[@]}"; do
  value="${!key-}"
  # Skip unset keys. PUBLIC_BASE_URL is intentionally left blank so the app
  # auto-detects its own Cloud Run URL from the incoming request.
  [[ -z "${value}" ]] && continue
  # Single-quote the YAML value and escape embedded single quotes.
  escaped="${value//\'/\'\'}"
  printf "%s: '%s'\n" "$key" "$escaped" >> "$ENV_YAML"
  wrote_any=true
done

DEPLOY_ARGS=(
  run deploy "$SERVICE"
  --source .
  --project "$GCP_PROJECT"
  --region "$GCP_REGION"
  --platform managed
  # Webhooks are delivered by the platform as unauthenticated POSTs, so the
  # service must be publicly reachable. Requests are still verified via the
  # HMAC WEBHOOK_SECRET inside the app.
  --allow-unauthenticated
  --port 8080
)

if [[ "$wrote_any" == true ]]; then
  DEPLOY_ARGS+=(--env-vars-file "$ENV_YAML")
else
  echo "WARNING: No app env vars found to set. The app needs at least API_BASE_URL." >&2
fi

echo "==> Deploying to Cloud Run (building from Dockerfile via Cloud Build)..."
gcloud "${DEPLOY_ARGS[@]}"

URL="$(gcloud run services describe "$SERVICE" --project "$GCP_PROJECT" --region "$GCP_REGION" --format='value(status.url)')"
echo ""
echo "==> Deployed: $URL"
echo "    Webhook endpoint: $URL/api/webhooks/verification"
echo ""
echo "The app auto-detects this URL from incoming requests, so webhooks are"
echo "configured automatically. To pin it explicitly, set PUBLIC_BASE_URL=$URL"
echo "in $ENV_FILE and re-run this script."
