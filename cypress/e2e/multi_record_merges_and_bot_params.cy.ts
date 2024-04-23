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

				cy.getByIdFragment("div", "outputs")
					.find(".readonly-input")
					.eq(0)
					.should("have.text", "Hello ID-001")
				cy.getByIdFragment("div", "outputs")
					.find(".readonly-input")
					.eq(1)
					.should("have.text", "Hello ID-002")
			})
		}
	)
})
