#!/bin/bash

# Update Settings App to Chinese
# 将 Settings App 的名称和描述改为中文

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Update Settings App to Chinese${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Configuration
API_URL="${API_URL:-https://i149gvmuh8.execute-api.us-east-1.amazonaws.com/prod}"

# Check if JWT token is provided
if [ -z "$JWT_TOKEN" ]; then
  echo -e "${YELLOW}JWT_TOKEN not set. Please provide your JWT token.${NC}"
  echo ""
  echo "You can get your token by:"
  echo "1. Login to DID Login UI (https://main.d2fozf421c6ftf.amplifyapp.com)"
  echo "2. Open browser DevTools (F12)"
  echo "3. Go to Application → Local Storage"
  echo "4. Copy the 'token' value"
  echo ""
  read -p "Enter your JWT token: " JWT_TOKEN
  echo ""
fi

# Validate token
if [ -z "$JWT_TOKEN" ]; then
  echo -e "${RED}Error: JWT token is required${NC}"
  exit 1
fi

echo -e "${BLUE}Finding Settings app...${NC}"

# Get all projects to find one where user is admin
PROJECTS_RESPONSE=$(curl -s -X GET "$API_URL/api/projects" \
  -H "Authorization: Bearer $JWT_TOKEN")

PROJECT_ID=$(echo "$PROJECTS_RESPONSE" | jq -r '.data[0].project_id')

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" == "null" ]; then
  echo -e "${RED}Error: No projects found${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Using project: $PROJECT_ID${NC}"
echo ""

# Get apps list
echo -e "${BLUE}Getting apps list...${NC}"
APPS_RESPONSE=$(curl -s -X GET "$API_URL/api/projects/$PROJECT_ID/apps" \
  -H "Authorization: Bearer $JWT_TOKEN")

# Find Settings app
APP_ID=$(echo "$APPS_RESPONSE" | jq -r '.data[] | select(.app_name == "Settings" or .app_name == "设置") | .app_id')

if [ -z "$APP_ID" ] || [ "$APP_ID" == "null" ]; then
  echo -e "${RED}Error: Settings app not found${NC}"
  echo ""
  echo -e "${YELLOW}Available apps:${NC}"
  echo "$APPS_RESPONSE" | jq -r '.data[] | "  - \(.app_name) (\(.app_id))"'
  exit 1
fi

echo -e "${GREEN}✓ Found Settings app: $APP_ID${NC}"
echo ""

# Update app
echo -e "${BLUE}Updating app to Chinese...${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL/api/apps/$APP_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "app_name": "设置",
    "app_description": "管理你的个人资料和项目",
    "emoji": "⚙️"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo ""

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  echo -e "${GREEN}✅ Success! App updated to Chinese.${NC}"
  echo ""
  echo -e "${BLUE}Updated information:${NC}"
  echo "  Name: 设置"
  echo "  Description: 管理你的个人资料和项目"
  echo "  Emoji: ⚙️"
  echo ""
  echo -e "${GREEN}Next steps:${NC}"
  echo "1. Refresh the DID Login Dashboard"
  echo "2. You should see '设置 ⚙️' instead of 'Settings ⚙️'"
else
  echo -e "${RED}❌ Error: Failed to update app (HTTP $HTTP_CODE)${NC}"
  echo ""
  echo -e "${RED}Response:${NC}"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  exit 1
fi
