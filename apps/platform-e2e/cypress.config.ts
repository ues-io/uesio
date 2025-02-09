import { nxE2EPreset } from "@nx/cypress/plugins/cypress-preset"
import { defineConfig } from "cypress"

const studioBaseUrl =
  process.env.UESIO_APP_URL || `https://studio.uesio-dev.com:3000`
const automationUsername = process.env.UESIO_AUTOMATION_USERNAME || "uesio"
const automationPassword = process.env.UESIO_AUTOMATION_PASSWORD
const useMockLogin = !automationPassword
const inCi = process.env.CI === "true"

export default defineConfig({
  e2e: {
    ...nxE2EPreset(__filename, {
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
