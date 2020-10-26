# Uesio

This project was generated using [Nx](https://nx.dev).

TEMPORARY DOCS:

To get the app back up and running:

```
npm install
npm run nx -- build cli
npm run nx -- build platform
cd apps/platform/ssl
./create.sh
cd ../../../
npm run nx -- build lazymonaco
npm run nx -- build vendor
npm run nx -- build yaml
npm run nx -- build ui
npm run nx -- build buildtime
npm run nx -- build uesioapps-uesio
npm run nx -- build uesioapps-sample
npm run nx -- build uesioapps-material
npm run nx -- serve platform
```
