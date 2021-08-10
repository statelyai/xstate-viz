#!/bin/bash

# This script tells vercel which branches to build,
# and which to ignore

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"
echo "VERCEL_GIT_COMMIT_SHA: $VERCEL_GIT_COMMIT_SHA"

if [[ "$VERCEL_GIT_COMMIT_REF" == "dev" || "$VERCEL_GIT_COMMIT_REF" == "staging" || "$VERCEL_GIT_COMMIT_REF" == "main" ]] ; then
  echo "✅ - Build can proceed"
  exit 1;
elif [[ "$VERCEL_GIT_COMMIT_SHA" == "$(git rev-parse --short main)" ]] ; then
  echo "✅ - Build can proceed"
  exit 1;
else
  echo "🛑 - Build cancelled"
  exit 0;
fi
