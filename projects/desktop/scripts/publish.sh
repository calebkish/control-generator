#/usr/bin/env sh

# This script will be used by the CI pipeline to build an installer (like an exe
# file) and add it as an artifact onto an new/existing GitHub release. Make sure
# to have the GH_TOKEN environment variable set, and that the token has
# proper permissions.
# Create a token here: https://git.rockfin.com/settings/tokens

if [ "$(basename "$PWD")" != 'desktop' ]; then
    echo "Must be in the projects/desktop/ folder when running this script."
    exit 1
fi

export SEMVER="$1"

if [ -z "$SEMVER" ]; then
    echo "SEMVER argument was not provided."
    exit 1
fi

rm -rf dist tsc-out

node --run tsc

(
    cd ../frontend
    node --run build
    cp -r dist/control-generator/browser ../desktop/tsc-out
)


npm version "$SEMVER"

# Will allow electron-builder to download artifacts from github.com
export NODE_TLS_REJECT_UNAUTHORIZED=0

node --run electron-builder -- --publish=always --windows
