## Getting started

### Run app within electron locally

1. `cd projects/frontend && npm run start`
1. `cd projects/desktop && npm run http:dev`
1. `cd projects/desktop && npm run start:watch`

### Run app within a browser tab locally

1. `cd projects/frontend && npm run start`
1. `cd projects/desktop && npm run http:dev`
1. Navigate to `http://localhost:4200`

### Publishing

```sh
cd projects/desktop
npm run tsc
cd ../frontend
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

---

Run this stuff initially:
```sh
git clone https://github.com/calebkish/control-generator.git
cd control-generator
```

In one terminal (inside the `control-generator` folder):
```sh
cd projects/frontend
npm install --force
npm run start
```

In another terminal (inside the `control-generator` folder):
```sh
cd projects/desktop
npm install
npm run http:dev
```

Then open browser to `http://localhost:4200`
