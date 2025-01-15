# HTTP Caching in Uesio runtime

Uesio-provided static assets, such as fonts, JS, CSS, are served to browsers by the Go app.

For a particular Uesio Docker image, these assets will NEVER change. Therefore, we treat these assets as immutable, and serve them in such a way that browsers will cache them forever (1 year, technically, but practically forever).

This is accomplished by serving these assets freom URLs which contain the Docker image's associated GIT SHA, e.g.

- `/{GITSHA}/fonts/roboto-v20-latin-300.woff`
- `/{GITSHA}/static/ui/uesio.js`

along with the necessary HTTP caching headers to instruct browsers to permanently cache these resources, e.g.

- `cache-control: private, no-transform, max-age=31536000, s-maxage=31536000`
- `date: Fri, 06 Jan 2023 16:22:21 GMT`
- `last-modified: Tue, 03 Jan 2023 22:09:59 GMT`

Each time that a new Uesio Docker image is built, it will have a new, unique Git SHA, which will be used as the new prefix for static asset serving, and so the browser will have to download the new assets, since their resource path will have changed, e.g.

- `/image-1-sha/static/ui/uesio.js`
- `/image-2-sha/static/ui/uesio.js`
- ...
