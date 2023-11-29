/// <reference types="cypress" />

import { getWorkspaceRoutePreviewPath } from "../support/paths"

describe("Wire Merges: $Records", () => {
	// Use the tests app and dev workspace, which will exist if Integration Tests have been run
	const appName = "tests"
	const workspaceName = "dev"
	const username = Cypress.env("automation_username")

	before(() => {
		cy.login()
	})

	const viewName = "multi_record_merges_and_bot_params"

	context(
		"Tests that values from multiple records can be sent to Bot params",
		() => {
			it("should get all record names, and have a bot prefix them", () => {
				cy.visitRoute(
					getWorkspaceRoutePreviewPath(
						appName,
						workspaceName,
						username,
						viewName
					)
				)
				cy.clickButton("prefixValues")
				cy.get('input[value="Hello ID-001"]').should("exist")
				cy.get('input[value="Hello ID-002"]').should("exist")
			})
		}
	)
})
