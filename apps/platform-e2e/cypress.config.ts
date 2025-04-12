import { nxE2EPreset } from "@nx/cypress/plugins/cypress-preset.js"
import { defineConfig } from "cypress"

const scheme = process.env.UESIO_USE_HTTPS === "true" ? "https" : "http"
const primaryDomain = process.env.UESIO_PRIMARY_DOMAIN || "uesio.localhost"
const port = process.env.UESIO_PORT || "3000"
const studioBaseUrl = `${scheme}://studio.${primaryDomain}:${port}`
const automationUsername = process.env.UESIO_AUTOMATION_USERNAME || "uesio"
const automationPassword = process.env.UESIO_AUTOMATION_PASSWORD
const useMockLogin = !automationPassword
const inCi = process.env.CI === "true"

export default defineConfig({
  e2e: {
    // NOTE: CI workflow captures output from cypress so the output folders (e.g., screenshots, videos)
    // should be kept in sync with the captured directory in the workflow file (.github/workflows/ci.yml)
    ...nxE2EPreset(import.meta.filename, {
      cypressDir: "cypress",
    }),
    baseUrl: studioBaseUrl,
    viewportWidth: 1024,
  },
  video: false,
  env: {
    in_ci: inCi,
    automation_password: automationPassword,
    automation_username: automationUsername,
    use_mock_login: useMockLogin,
  },
  // Cypress makes a DNS call for baseUrl to check availability however since we use
  // studio.uesio.localhost, unless there is a hosts entry it won't resolve causing cypress
  // to display "Warning: Cannot Connect Base Url Warning" on startup page in Cypress UI
  // and "Cypress could not verify that this server is running: http://studio.uesio.localhost:3000"
  // in headless runner.  The error is benign and the tests themselves would still work
  // since the browsers don't make DNS calls for "localhost" or *.localhost domains as "localhost"
  // is "special" (see https://www.rfc-editor.org/rfc/rfc6761#section-6.3) and browsers avoid
  // querying DNS for security reasons and just follow the spec. All that said, to avoid the
  // error message in cypress itself, adding a hosts entry to config so cypress will not query
  // DNS and thus avoid the misleading warning.
  // See https://github.com/cypress-io/cypress/issues/1488#issuecomment-396435553 &
  // https://github.com/cypress-io/cypress/issues/25512#issuecomment-2781162814
  ...(primaryDomain === "localhost" || primaryDomain.endsWith(".localhost")
    ? {
        hosts: {
          "*.localhost": "127.0.0.1",
        },
      }
    : {}),
})
