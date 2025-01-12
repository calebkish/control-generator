#/usr/bin/env sh

# Use this script to build an installer (like an exe file) locally.

if [ "$(basename "$PWD")" != 'desktop' ]; then
    echo "Must be in the projects/desktop/ folder when running this script."
    exit 1
fi

rm -rf dist tsc-out

node --run tsc

(
    cd ../frontend
    node --run build
    cp -r dist/control-generator/browser ../desktop/tsc-out
)

# Will allow electron-builder to download artifacts from github.com
export NODE_TLS_REJECT_UNAUTHORIZED=0

node --run electron-builder -- --windows
