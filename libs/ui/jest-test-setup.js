// https://stackoverflow.com/a/57312218
const noop = () => {}
Object.defineProperty(window, "scrollTo", { value: noop, writable: true })
