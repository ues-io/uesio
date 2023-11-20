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

	const loadAnimalAndVerifyDetailView = (
		idx: number,
		expectedTitle: string
	) => {
		cy.getByIdFragment("div", "uesio/io.deck:animalsDeck")
			.children()
			.eq(idx)
			.click()
		// This should load our detail view, which should initiate a wire load to fetch that animal's details
		cy.getByIdFragment("div", "animalTitle").should("exist")
		cy.getByIdFragment("div", "animalTitle").should(
			"have.text",
			expectedTitle
		)
	}

	context("Wire loads", () => {
		it("should reload wires when view params change", () => {
			// Visit the original route
			visitRoute()
			// Verify that the animal title area is not displayed initially
			cy.getByIdFragment("div", "animalTitle").should("not.exist")
			// Click on the first animal
			loadAnimalAndVerifyDetailView(0, "Abazi Daron")
			loadAnimalAndVerifyDetailView(1, "Abrahamian Skelly")
		})
	})
})
