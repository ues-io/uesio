import { nxE2EPreset } from "@nx/cypress/plugins/cypress-preset.js"
import { defineConfig } from "cypress"

const scheme = process.env.UESIO_USE_HTTPS === "true" ? "https" : "http"
const primaryDomain = process.env.UESIO_PRIMARY_DOMAIN || "localhost"
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
