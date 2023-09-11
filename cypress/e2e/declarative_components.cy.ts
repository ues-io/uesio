/// <reference types="cypress" />

import { getViewID } from "cypress/support/views"
import { getWorkspaceRoutePreviewPath } from "../support/paths"

describe("Declarative Components", () => {
	// Use the tests app and dev workspace, which will exist if Integration Tests have been run
	const appName = "tests"
	const workspaceName = "dev"
	const username = Cypress.env("automation_username")
	const viewName = "declarative_components"

	before(() => {
		cy.login()
	})

	context("Test loading of declarative Components in a View", () => {
		it("should load the declarative components", () => {
			cy.visitRoute(
				getWorkspaceRoutePreviewPath(
					appName,
					workspaceName,
					username,
					viewName
				)
			)
			cy.get("div#root").should("contain", "Such declarative")
			cy.get("div#root").should("contain", "Much magic")
		})
	})
})
