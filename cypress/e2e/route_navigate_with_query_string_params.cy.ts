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
			visitRoute()
			cy.clickButtonIfExists("showParamButton")
			cy.url().should("include", "?show=true")
			cy.getByIdFragment("div", "alwaysShown")
				.should("have.length", 1)
				.and("contain", "Always shown")
			cy.getByIdFragment("div", "conditionallyShown")
				.should("have.length", 1)
				.and("contain", "Only shown if show is true")
		})
		it("should not send the param", () => {
			visitRoute()
			cy.clickButtonIfExists("noParamButton")
			cy.url().should("not.include", "?show")
			cy.getByIdFragment("div", "alwaysShown")
				.should("have.length", 1)
				.and("contain", "Always shown")
			cy.getByIdFragment("div", "conditionallyShown").should(
				"have.length",
				0
			)
		})
	})
})
