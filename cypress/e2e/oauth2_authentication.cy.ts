/// <reference types="cypress" />

import { getBaseUrl, getWorkspaceBasePath } from "../support/paths"

describe("OAuth 2 Authorization Code flow", () => {
  // Use the tests app and dev workspace, which will exist if Integration Tests have been run
  const appName = "tests"
  const workspaceName = "dev"
  const username = "uesio"

  before(() => {
    cy.login()
  })

  const testAuthBtn = () => cy.getByIdFragment("button", "test-authentication")
  const authBtn = () => cy.getByIdFragment("button", "authenticate")
  const clearCredsBtn = () => cy.getByIdFragment("button", "clear-credentials")
  const hasAccessToken = () => cy.getByIdFragment("input", "has-access-token")
  const hasRefreshToken = () => cy.getByIdFragment("input", "has-refresh-token")

  const integrationName = "oauth2_authorization_code_2"
  const integrationDetailRoute = `/integrations/${username}/${appName}/${integrationName}`

  context("Workspace mode", () => {
    it("should perform the OAuth authorization code flow to get credentials", () => {
      // Go to the Integration detail page
      cy.visit(
        getWorkspaceBasePath(appName, workspaceName) + integrationDetailRoute,
        {
          headers: {},
          onBeforeLoad: (window) => {
            cy.stub(window, "open")
              .as("open")
              .callsFake(cy.stub().as("openFunc"))
          },
        },
      )
      cy.url().should("include", integrationDetailRoute)
      // Initially we should NOT have access credentials
      testAuthBtn().should("exist")
      testAuthBtn().click()

      // If we're coming from a prior test run, kill previous auth
      cy.clickButtonIfExists("clear-credentials")

      hasAccessToken().should("exist").and("be.disabled")
      hasRefreshToken().should("not.exist")

      // Click the Authenticate button. Verify that the OAuth authorize URL was opened
      authBtn().should("exist").click()
      cy.window().its("open").should("be.called")
      cy.get("@open").should("have.been.calledOnce")
      cy.get("@openFunc").then((func) => {
        const theFunc = func as unknown as sinon.SinonStub
        expect(theFunc).to.have.been.calledOnce
        const [url, queryString] = theFunc.firstCall.args[0].split("?")
        cy.log("url", url)
        // Verify that the URL is correct
        expect(url).to.contain(
          "/workspace/uesio/tests/dev/routes/path/uesio/tests/mock_oauth_authorize_url",
        )
        const parsed = new URLSearchParams(queryString)
        expect(parsed.get("state")).to.have.length.greaterThan(0)
        const state = parsed.get("state") || ""
        const callbackUrl = `${getBaseUrl()}/site/oauth2/callback`
        // Now open the callback URL manually, to simulate what should have happened by opening the window
        const fakeAuthCode = "authcode123"
        cy.visit(`${callbackUrl}?state=${state}&code=${fakeAuthCode}`, {
          headers: {},
        })
        cy.url().should("include", "/site/oauth2/callback")
        cy.getByIdFragment("span", "auth-message").should(
          "contain",
          "Authentication successful!",
        )
        // Now go back to the integration page and reopen the Test Auth dialog
        cy.visit(
          getWorkspaceBasePath(appName, workspaceName) + integrationDetailRoute,
        )
        cy.url().should("include", integrationDetailRoute)
        testAuthBtn().should("exist")
        testAuthBtn().click()
        hasAccessToken().should("exist").and("have.attr", "checked", "checked")
        hasRefreshToken().should("exist").and("have.attr", "checked", "checked")
        // Now, clear credentials
        clearCredsBtn().should("exist")
        clearCredsBtn().click()
        hasAccessToken().should("exist").and("be.disabled")
        hasRefreshToken().should("not.exist")
      })
    })
  })
})
