# Vendor

This module generates static NPM vendor dependences, e.g. Monaco, and copies them into a /vendor folder within the /dist directory. This entire project will likely be removed when an esm version of monaco is released.

For now this project only supports the copying of monaco files into the dist directory.

## Adding a vendor dependency

Do not add any more vendor dependencies. Use component pack features to add client-side libraries.
