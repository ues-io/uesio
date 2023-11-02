/// <reference types="cypress" />

import Sinon from "cypress/types/sinon"
import { getBaseUrl, getWorkspaceBasePath } from "../support/paths"

describe("OAuth 2 Authorization Code flow", () => {
	// Use the tests app and dev workspace, which will exist if Integration Tests have been run
	const appName = "tests"
	const workspaceName = "dev"
	const username = "uesio"

	before(() => {
		cy.login()
	})

	const testAuthBtn = () =>
		cy.getByIdFragment("button", "test-authentication")
	const authBtn = () => cy.getByIdFragment("button", "authenticate")
	const clearCredsBtn = () =>
		cy.getByIdFragment("button", "clear-credentials")
	const hasAccessToken = () => cy.getByIdFragment("input", "has-access-token")
	const hasRefreshToken = () =>
		cy.getByIdFragment("input", "has-refresh-token")

	const integrationName = "oauth2_authorization_code_2"
	const integrationDetailRoute = `/integrations/${username}/${appName}/${integrationName}`

	context("Workspace mode", () => {
		it("should perform the OAuth authorization code flow to get credentials", () => {
			// Go to the Integration detail page
			let stub: Sinon.SinonStub | undefined
			cy.visit(
				getWorkspaceBasePath(appName, workspaceName) +
					integrationDetailRoute,
				{
					headers: {},
					// Stub window.open, we need to verify that it was invoked,
					// and Cypress doesn't actually support navigation to other windows
					onBeforeLoad(win) {
						stub = cy.stub(win, "open")
					},
				}
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
			const callbackUrl = `${getBaseUrl()}/site/oauth2/callback`
			if (stub) {
				const openedUrl = stub.firstCall.args[0]
				expect(openedUrl).to.contain(
					`${getWorkspaceBasePath(
						appName,
						workspaceName
					)}/routes/path/uesio/tests/mock_oauth_authorize_url`
				)
			}
			// Now open the callback URL manually, to simulate what should have happened by opening the window
			// This state is base64 encoded, and contains the integration ID, a nonce, the workspace name, and app name.
			// You can generate something like this using state_test.go, marshalling a state and then grabbing the encoded string
			const state =
				"eyJuIjoiMTIzIiwiaSI6InVlc2lvL3Rlc3RzLm9hdXRoMl9hdXRob3JpemF0aW9uX2NvZGVfMiIsImMiOiJ3IiwiYSI6InVlc2lvL3Rlc3RzIiwidyI6ImRldiJ9"
			const fakeAuthCode = "authcode123"
			let closeStub: Sinon.SinonStub | undefined
			cy.visit(`${callbackUrl}?state=${state}&code=${fakeAuthCode}`, {
				headers: {},
				// Stub window.close, we need to verify that it was invoked
				onBeforeLoad(win) {
					closeStub = cy.stub(win, "close")
				},
			})
			cy.url().should("include", "/site/oauth2/callback")
			cy.getByIdFragment("span", "auth-message").should(
				"contain",
				"Authentication successful!"
			)
			if (closeStub) {
				expect(closeStub.calledOnce).to.be.true
			}
			// Now go back to the integration page and reopen the Test Auth dialog
			cy.visit(
				getWorkspaceBasePath(appName, workspaceName) +
					integrationDetailRoute
			)
			cy.url().should("include", integrationDetailRoute)
			testAuthBtn().should("exist")
			testAuthBtn().click()
			hasAccessToken()
				.should("exist")
				.and("have.attr", "checked", "checked")
			hasRefreshToken()
				.should("exist")
				.and("have.attr", "checked", "checked")
			// Now, clear credentials
			clearCredsBtn().should("exist")
			clearCredsBtn().click()
			hasAccessToken().should("exist").and("be.disabled")
			hasRefreshToken().should("not.exist")
		})
	})
})
