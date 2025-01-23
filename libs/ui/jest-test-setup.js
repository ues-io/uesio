// jsdom does not implement scrollTo - See https://stackoverflow.com/a/57312218 & https://github.com/jsdom/jsdom/blob/b1c0072e306e4e9ad83a5e1ddf0e356ba044bd25/lib/jsdom/browser/Window.js#L904
Object.defineProperty(window, "scrollTo", { value: jest.fn(), writable: true })
