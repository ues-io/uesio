# vendor

This module generates static NPM vendor dependences, e.g. Monaco, and copies them into a /vendor folder within the /dist directory, along with a manifest which can be read by server-side code to know where these vendored assets are located, so that corresponding URLs can be precomputed server-side and used when we are rendering the index.gohtml template.

For example, if you run `nx build vendor`, you should see an output `manifest.json` generated within the `/dist/vendor` folder looking something like this:

```
{"monaco-editor":{"version":"0.34.0"}}
```

## Adding a vendor dependency

If you need to add a vendor dependency, do the following:

1. `use npm install --save-dev <DEP_NAME@VERSION>` to install the dependency, and update the package.json
2. Update `gulpfile.js` in the `// BEGIN EDITABLE REGION` section to add the name of the module and the path to the file that you want to load.
3. To test, re-run `npm run build-all`. The file should be loaded
