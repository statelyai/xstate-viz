#!/bin/bash

# This script tells vercel which branches to build,
# and which to ignore

function get_branch_hash () {
  local result="$(git rev-parse --short $1)"
  echo "$result"
}

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"
echo "VERCEL_GIT_COMMIT_SHA: $VERCEL_GIT_COMMIT_SHA"
echo "main hash: $(get_branch_hash main)"

if [[ "$VERCEL_GIT_COMMIT_REF" == "dev" || "$VERCEL_GIT_COMMIT_REF" == "staging" || "$VERCEL_GIT_COMMIT_REF" == "main" ]] ; then
  echo "✅ - Build can proceed"
  exit 1;
# check if the current hash matches the tip of the main branch
# multiple branches can point to a single hash
# this tries to avoid a situation when a build targeting main gets skipped because a feature branch got assigned to VERCEL_GIT_COMMIT_REF
elif [[ "$VERCEL_GIT_COMMIT_SHA" == "$(get_branch_hash main)" ]] ; then
  echo "✅ - Build can proceed"
  exit 1;
else
  echo "🛑 - Build cancelled"
  exit 0;
fi
