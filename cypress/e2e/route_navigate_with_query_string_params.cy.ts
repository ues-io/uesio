/// <reference types="cypress" />

import { getWorkspaceRoutePreviewPath } from "../support/paths"

describe("route/NAVIGATE to views with params", () => {
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
				"route_navigate_to_view_with_optional_param"
			)
		)

	context("Navigate with/without a param", () => {
		it("should preserve the param during route navigates", () => {
			const assertions = () => {
				cy.url().should("include", "?show=true")
				cy.title().should(
					"eq",
					"View that has a single optional param. SHOW=true"
				)
				cy.getByIdFragment("div", "alwaysShown")
					.should("have.length", 1)
					.and("contain", "Always shown")
				cy.getByIdFragment("div", "conditionallyShown")
					.should("have.length", 1)
					.and("contain", "Only shown if show is true")
			}
			// Visit the original route
			visitRoute()
			// Click the button to do a route/NAVIGATE with the param
			cy.clickButtonIfExists("showParamButton")
			// Run our assertions
			assertions()
			// Reload the page and run our assertions again
			cy.reload()
			assertions()
			// Use browser navigation to go back and forth, then run our assertions again
			cy.go("back")
			cy.go("forward")
			assertions()
		})
		it("should not send the param", () => {
			const assertions = () => {
				cy.url().should("not.include", "?show")
				cy.title().should(
					"eq",
					"View that has a single optional param. SHOW="
				)
				cy.getByIdFragment("div", "alwaysShown")
					.should("have.length", 1)
					.and("contain", "Always shown")
				cy.getByIdFragment("div", "conditionallyShown").should(
					"have.length",
					0
				)
			}
			// Visit the original route
			visitRoute()
			// Click the button to do a route/NAVIGATE WITHOUT the param
			cy.clickButtonIfExists("noParamButton")
			// Run our assertions
			assertions()
			// Reload the page and run our assertions again
			cy.reload()
			assertions()
			// Use browser navigation to go back and forth, then run our assertions again
			cy.go("back")
			cy.go("forward")
			assertions()
		})
	})
})
