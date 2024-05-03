#!/usr/bin/env sh

cd projects/control-generator
npm run start &
ANGULAR_DEV_SERVER_PID=$!

cd ../desktop
npm run http:dev &
HTTP_DEV_SERVER_PID=$!
