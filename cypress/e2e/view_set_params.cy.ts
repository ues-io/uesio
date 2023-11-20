/// <reference types="cypress" />

import { getWorkspaceRoutePreviewPath } from "../support/paths"

describe("View SET_PARAMS signal and wire reloading", () => {
	// Use the tests app and dev workspace, which will exist if Integration Tests have been run
	const appName = "tests"
	const workspaceName = "dev"
	const username = Cypress.env("automation_username")

	beforeEach(() => {
		cy.login()
	})

	const visitRoute = () =>
		cy.visitRoute(
			getWorkspaceRoutePreviewPath(
				appName,
				workspaceName,
				username,
				"animals_queue_view"
			)
		)

	context("Wire loads", () => {
		it("should reload wires when view params change", () => {
			// Visit the original route
			visitRoute()
			// Click on the first animal
			cy.get("div[id*='uesio/io.deck:animalsDeck']:first-child").click()
			// This should load our detail view, which should initiate a wire load to fetch that animal's details
		})
	})
})
