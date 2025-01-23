// https://stackoverflow.com/a/57312218
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}
Object.defineProperty(window, "scrollTo", { value: noop, writable: true })
