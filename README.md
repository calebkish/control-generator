## Getting started

Run this stuff initially:
```sh
git clone https://github.com/calebkish/control-generator.git
cd control-generator
```

### Run app within a browser tab locally

1. `cd projects/frontend && npm run start`
1. `cd projects/desktop && npm run http:dev`
1. Navigate to `http://localhost:4200`


### Run app within electron locally

1. `cd projects/frontend && npm run start`
1. `cd projects/desktop && npm run http:dev`
1. `cd projects/desktop && npm run start`

### Building

```sh
cd projects/desktop
./scripts/build.sh
```

### Publishing

```sh
cd projects/desktop
./scripts/publish-local.sh '0.0.30'
```

--------------------------------------------------------------------------------

Fix:

Cannot download differentially, fallback to full download: Error: sha512 checksum mismatch, expected wPxVo0Re1tVwq2jldhztBdTXsRwH39tvDMaJesWSDwDCBrYE+EarJT1A5BcmyeKgn0l5LttQpkbzUV0ivE7fhw==, got uxDv1KYyCBaHx6QkAug9ETHU+B0mf3QeBu/FQpgLFJTNd44kClKy8V4LkNmSbHI4U98el4omb1GaQ+K2Q6LbeQ==
