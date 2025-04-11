# HTTP Caching in Uesio runtime

## Changing non readme file

Uesio-provided static assets, such as fonts, JS, CSS, are served to browsers by the Go app.

For a particular Uesio Docker image, these assets will NEVER change. Therefore, we treat these assets as immutable, and serve them in such a way that browsers will cache them forever (1 year, technically, but practically forever).

This is accomplished by serving these assets from URLs which contain the Docker image's associated `UESIO_BUILD_VERSION`, e.g.

- `/{UESIO_BUILD_VERSION}/fonts/roboto-v20-latin-300.woff`
- `/{UESIO_BUILD_VERSION}/static/ui/uesio.js`

along with the necessary HTTP caching headers to instruct browsers to permanently cache these resources, e.g.

- `cache-control: private, no-transform, max-age=31536000, s-maxage=31536000`
- `date: Fri, 06 Jan 2023 16:22:21 GMT`
- `last-modified: Tue, 03 Jan 2023 22:09:59 GMT`

Each time that a new Uesio Docker image is built, it will have a new, unique `UESIO_BUILD_VERSION`, which will be used as the new prefix for static asset serving, and so the browser will have to download the new assets, since their resource path will have changed, e.g.

- `/image-1-sha/static/ui/uesio.js`
- `/image-2-sha/static/ui/uesio.js`
- ...

`UESIO_BUILD_VERSION` must be one of the following formats:

- Uesio bundle version string, e.g. v1.2.3
- A string containing only letters & digits with a minimum length of 8, optionally followed by one or two segments of digits separated by a period (`.`), e.g.,
  - a short Git sha followed by runnumber.runattempt, e.g., abcd1234.13.3
  - current unix epoch time (e.g., 1738704509)
