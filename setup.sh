#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# VoteWise — Secret Manager Setup Script
# Run this AFTER deploying the backend to Cloud Run.
# ═══════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────
PROJECT_ID="${PROJECT_ID:-your-gcp-project-id}"
REGION="${REGION:-asia-south1}"
SERVICE_NAME="${SERVICE_NAME:-votewise-backend}"
SECRET_NAME="GEMINI_API_KEY"

# ── Colors ───────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  VoteWise — Secret Manager Setup${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"

# ── Validate prerequisites ──────────────────────────────────────────
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed.${NC}"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if [[ "$PROJECT_ID" == "your-gcp-project-id" ]]; then
    echo -e "${YELLOW}Please set PROJECT_ID environment variable:${NC}"
    echo "  export PROJECT_ID=your-actual-project-id"
    exit 1
fi

# ── Step 1: Enable Secret Manager API ────────────────────────────────
echo -e "\n${YELLOW}[1/5] Enabling Secret Manager API...${NC}"
gcloud services enable secretmanager.googleapis.com --project="$PROJECT_ID"
echo -e "${GREEN}✓ Secret Manager API enabled${NC}"

# ── Step 2: Create the secret ────────────────────────────────────────
echo -e "\n${YELLOW}[2/5] Creating secret...${NC}"
if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" &> /dev/null; then
    echo -e "${YELLOW}Secret '$SECRET_NAME' already exists. Adding new version...${NC}"
    echo -n "Enter your Gemini API key: "
    read -rs GEMINI_API_KEY_VALUE
    echo
    echo -n "$GEMINI_API_KEY_VALUE" | \
        gcloud secrets versions add "$SECRET_NAME" \
            --data-file=- \
            --project="$PROJECT_ID"
else
    echo -n "Enter your Gemini API key: "
    read -rs GEMINI_API_KEY_VALUE
    echo
    echo -n "$GEMINI_API_KEY_VALUE" | \
        gcloud secrets create "$SECRET_NAME" \
            --data-file=- \
            --replication-policy="automatic" \
            --project="$PROJECT_ID"
fi
echo -e "${GREEN}✓ Secret created/updated${NC}"

# ── Step 3: Get Cloud Run service account ────────────────────────────
echo -e "\n${YELLOW}[3/5] Getting Cloud Run service account...${NC}"
SA=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(spec.template.spec.serviceAccountName)")

if [[ -z "$SA" ]]; then
    # Default Compute Engine service account
    PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
    SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
    echo -e "${YELLOW}Using default compute SA: $SA${NC}"
else
    echo -e "${GREEN}Found service account: $SA${NC}"
fi

# ── Step 4: Grant secretAccessor role ────────────────────────────────
echo -e "\n${YELLOW}[4/5] Granting secretAccessor role...${NC}"
gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
    --member="serviceAccount:$SA" \
    --role="roles/secretmanager.secretAccessor" \
    --project="$PROJECT_ID"
echo -e "${GREEN}✓ IAM policy binding created${NC}"

# ── Step 5: Bind secret to Cloud Run service ─────────────────────────
echo -e "\n${YELLOW}[5/5] Binding secret to Cloud Run service...${NC}"
gcloud run services update "$SERVICE_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --update-secrets="GEMINI_API_KEY=${SECRET_NAME}:latest"
echo -e "${GREEN}✓ Secret bound to Cloud Run service${NC}"

# ── Done ─────────────────────────────────────────────────────────────
echo -e "\n${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Setup complete!${NC}"
echo -e "${GREEN}  API key is now injected securely from Secret Manager.${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "\nThe Cloud Run service will restart automatically with the new secret."
echo -e "Test with: curl \$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')/health"
