#!/bin/bash

echo -e "===\n>> Pre-push Hook: Checking branch name..."

BRANCH=`git rev-parse --abbrev-ref HEAD`
PROTECTED_BRANCHES="^(dev)"

if [[ "$BRANCH" =~ $PROTECTED_BRANCHES ]]
then
  echo -e "🚫 Cannot push to protected branch\n" && exit 1
fi

exit 0
