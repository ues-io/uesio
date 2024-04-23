/// <reference types="cypress" />

import { getWorkspaceRoutePreviewPath } from "../support/paths"

describe("route/NAVIGATE and route/NAVIGATE_TO_ROUTE", () => {
	// Use the tests app and dev workspace, which will exist if Integration Tests have been run
	const appName = "tests"
	const workspaceName = "dev"
	const username = Cypress.env("automation_username")

	beforeEach(() => {
		cy.login()
	})

	context("route/NAVIGATE with/without a param", () => {
		const visitRoute = () =>
			cy.visitRoute(
				getWorkspaceRoutePreviewPath(
					appName,
					workspaceName,
					username,
					"route_navigate_to_view_with_optional_param"
				)
			)

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
		it("should display a View preview dialog for parameter selection", () => {
			cy.visitRoute(
				`/app/${username}/${appName}/workspace/${workspaceName}/views/${username}/${appName}/view_with_single_optional_param`
			)
			cy.clickButton("preview-view")
			cy.get("input[value='false']").should("exist")
			cy.get("#launch-preview").click()
			cy.url().should(
				"include",
				"view_with_single_optional_param/preview?show=false"
			)
		})
		// Do the same thing, but in Route preview mode (there is a Route with an identical name to the View)
		it("should display a Route preview dialog for parameter selection", () => {
			cy.visitRoute(
				`/app/${username}/${appName}/workspace/${workspaceName}/routes/${username}/${appName}/view_with_single_optional_param`
			)
			cy.clickButton("preview-route")
			cy.get("input[value='false']").clear().type("true")
			cy.get("#launch-preview").click()
			cy.url().should(
				"include",
				"view_with_single_optional_param?show=true"
			)
		})
	})

	context("route/NAVIGATE_TO_ROUTE", () => {
		const visitRoute = () =>
			cy.visitRoute(
				getWorkspaceRoutePreviewPath(
					appName,
					workspaceName,
					username,
					"animals/list"
				)
			)

		it("it should resolve params as part of route naivgation", () => {
			visitRoute()
			cy.url().should("include", "/animals/list")
			// Click the button to do a route/NAVIGATE_TO_ROUTE signal
			cy.get("table[id$='animalsTable']>tbody>tr").should(
				"have.length",
				10
			)
			cy.get(
				"table[id$='animalsTable']>tbody>tr:nth-child(2) button.rowaction"
			).click()
			cy.url().should("include", "/animal/")
			cy.title().should("include", "Animal: ")
			// Use browser navigation to go back and forth
			cy.go("back")
			cy.url().should("include", "/animals/list")
			cy.get("table[id$='animalsTable']>tbody>tr").should(
				"have.length",
				10
			)
			cy.go("forward")
			cy.url().should("include", "/animal/")
			cy.title().should("include", "Animal: ")
			cy.getByIdFragment("div", "genusField").should("exist")
			cy.getByIdFragment("div", "speciesField").should("exist")
			cy.get("label[for*='ancestorField']").should(
				"have.text",
				"Direct ancestor (via Language Label)"
			)
			// Initiate a route/NAVIGATE_TO_ROUTE signal via button
			cy.clickButtonIfExists("go-to-animals-list")
			cy.url().should("include", "/animals/list")
			cy.get("table[id$='animalsTable']>tbody>tr").should(
				"have.length",
				10
			)
		})
	})
})
