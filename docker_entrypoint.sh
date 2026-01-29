#!/usr/bin/env sh
set -e

# Detect if running on ECS/Fargate (metadata env vars or execution env)
IS_ECS=0
if [ -n "$ECS_CONTAINER_METADATA_URI" ] || [ -n "$ECS_CONTAINER_METADATA_URI_V4" ] || echo "$AWS_EXECUTION_ENV" | grep -qi "ecs"; then
  IS_ECS=1
fi

# Resolve environment and default secret object name
: "${ENVIRONMENT:=production}"
if [ -z "$AWS_SECRETS_OBJECT_NAME" ]; then
  if [ "$ENVIRONMENT" = "development" ]; then
    AWS_SECRETS_OBJECT_NAME="development/busco"
  else
    AWS_SECRETS_OBJECT_NAME="production/busco"
  fi
fi

if [ "$IS_ECS" -eq 1 ]; then
  # Running on ECS/Fargate: fetch secrets and render to .env
  if [ -z "$AWS_REGION" ]; then
    echo "AWS_REGION is required to fetch secrets on ECS" >&2
    exit 1
  fi
  if ! aws secretsmanager get-secret-value --region "$AWS_REGION" --secret-id "$AWS_SECRETS_OBJECT_NAME" --query SecretString --output text | \
       jq -r 'to_entries | .[] | "\(.key)=\(.value)"' > /app/.env; then
    echo "Failed to fetch and process secrets from $AWS_SECRETS_OBJECT_NAME" >&2
    exit 1
  fi
else
  # Local run: prefer existing /app/.env and skip AWS entirely
  if [ -f /app/.env ]; then
    echo "Using local /app/.env (no AWS credentials required)."
  else
    echo "Local run: /app/.env not found. Skipping AWS secret fetch."
  fi
fi

# Download RDS CA certificate bundle for SSL connections
echo "Downloading RDS CA certificate bundle..."
if ! curl -sS https://truststore.pki.rds.amazonaws.com/me-central-1/me-central-1-bundle.pem -o /app/dist/libs/database/src/me-central-1-bundle.pem; then
  echo "Failed to download RDS CA certificate bundle" >&2
  exit 1
fi
echo "RDS CA certificate bundle downloaded successfully."

# Always run all apps via pm2
cat > /app/ecosystem.config.js <<'EOF'
module.exports = {
  apps: [
    {
      name: 'user',
      script: 'dist/apps/user-app/src/main.js',
      env: { 
        USER_PORT: process.env.USER_PORT || process.env.PORT || 3000, 
        ENVIRONMENT: process.env.ENVIRONMENT || 'production' 
      }
    },
    {
      name: 'admin',
      script: 'dist/apps/admin-app/src/main.js',
      env: { 
        ADMIN_PORT: process.env.ADMIN_PORT || 3004, 
        ENVIRONMENT: process.env.ENVIRONMENT || 'production' 
      }
    }
  ]
};
EOF

exec pm2-runtime start /app/ecosystem.config.js
