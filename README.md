## Getting started

### Run app within electron locally

1. `cd projects/control-generator && npm run start`
1. `cd projects/desktop && npm run http:dev`
1. `cd projects/desktop && npm run start:watch`

### Run app within a browser tab locally

1. `cd projects/control-generator && npm run start`
1. `cd projects/desktop && npm run http:dev`
1. Navigate to `http://localhost:4200`

### Publishing

```sh
cd projects/desktop
npm run tsc
cd ../control-generator
npm run cp
cd ../desktop

# For running locally
npm run dist:linux


# Update package.json version
npm version '0.0.6'

# For publishing GitHub release locally
npm run publish:dev

# For publishing GitHub release through CI/CD pipeline
npm run publish
```

After
