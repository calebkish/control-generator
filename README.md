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

--------------------------------------------------------------------------------

# todo

- [ ] control form export
  - that will spit out all relevant info to be given to auditors
  - want users to be able to export detail for one control, or multiple at a time
  - it will need to spit out the control form the user fills out as well as the control attributes
  - the form should have our logo on it as well.
  - pdf format would be nice

- [x] update logo

- [ ] add ability for company to use a secure model

- [ ] update the local model to be the newest llama model
