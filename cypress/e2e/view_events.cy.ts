/// <reference types="cypress" />

import { getWorkspaceRoutePreviewPath } from "../support/paths"

describe("View Only Wires", () => {
	// Use the tests app and dev workspace, which will exist if Integration Tests have been run
	const appName = "tests"
	const workspaceName = "dev"
	const username = Cypress.env("automation_username")

	before(() => {
		cy.login()
	})

	const viewName = "view_events"

	context("View Events", () => {
		it("The panel should be open", () => {
			cy.visitRoute(
				getWorkspaceRoutePreviewPath(
					appName,
					workspaceName,
					username,
					viewName
				)
			)
			cy.getByIdFragment("span", "mytext").should("have.length", 1)
		})
	})
})
