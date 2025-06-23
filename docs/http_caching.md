# HTTP Caching in Uesio runtime

Uesio-provided static assets, such as fonts, JS, CSS, are served to browsers by the Go app.

For a particular Uesio Docker image, these assets will NEVER change. Therefore, we treat these assets as immutable, and serve them in such a way that browsers will cache them forever (1 year, technically, but practically forever).

This is accomplished by serving these assets from URLs which contain the Docker image's associated `UESIO_BUILD_VERSION`, e.g.

- `/fonts/uesio/io/{UESIO_BUILD_VERSION}/roboto-v20-latin-300.woff`
- `/static/{UESIO_BUILD_VERSION}/ui/uesio.js`

along with the necessary HTTP caching headers to instruct browsers to permanently cache these resources, e.g.

- `cache-control: private, no-transform, max-age=31536000, s-maxage=31536000`
- `date: Fri, 06 Jan 2023 16:22:21 GMT`
- `last-modified: Tue, 03 Jan 2023 22:09:59 GMT`

Each time that a new Uesio Docker image is built, it will have a new, unique `UESIO_BUILD_VERSION`, which will be used as the new prefix for static asset serving, and so the browser will have to download the new assets, since their resource path will have changed, e.g.

- `/static/{UESIO_BUILD_VERSION_1}/ui/uesio.js`
- `/static/{UESIO_BUILD_VERSION_2}/ui/uesio.js`
- ...

`UESIO_BUILD_VERSION` must be one of the following formats:

- Uesio bundle version string, e.g. v1.2.3
- A string containing only letters & digits with a minimum length of 8, optionally followed by one or two segments of digits separated by a period (`.`), e.g.,
  - a short Git sha followed by runnumber.runattempt, e.g., abcd1234.13.3

While developing, you can automatically create a fake build version using a hash of the current time by setting the `UESIO_FORCE_HTTP_CACHING` environment variable to `true`.
