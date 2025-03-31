import { nxE2EPreset } from "@nx/cypress/plugins/cypress-preset.js"
import { defineConfig } from "cypress"

// legacy behavior default to https if not set or empty
// TODO: should default to http (localhost refactor)
const scheme =
  !process.env.UESIO_USE_HTTPS || process.env.UESIO_USE_HTTPS === "true"
    ? "https"
    : "http"
// legacy behavior default to uesio-dev.com if not set or empty
// TODO: should default to localhost (localhost refactor)
const primaryDomain = process.env.UESIO_PRIMARY_DOMAIN || "uesio-dev.com"
// legacy behavior default to 3000 if not set or empty
const port = process.env.UESIO_PORT || "3000"
const studioBaseUrl = `${scheme}://studio.${primaryDomain}:${port}`
const automationUsername = process.env.UESIO_AUTOMATION_USERNAME || "uesio"
const automationPassword = process.env.UESIO_AUTOMATION_PASSWORD
const useMockLogin = !automationPassword
const inCi = process.env.CI === "true"

export default defineConfig({
  e2e: {
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
})
