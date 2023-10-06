/// <reference types="cypress" />

import { getViewID } from "cypress/support/views"
import { getWorkspaceRoutePreviewPath } from "../support/paths"

describe("View Only Wires", () => {
	// Use the tests app and dev workspace, which will exist if Integration Tests have been run
	const appName = "tests"
	const workspaceName = "dev"
	const username = Cypress.env("automation_username")

	before(() => {
		cy.login()
	})

	const viewName = "view_only_wire"

	context("Route Navigation", () => {
		it("The wire record should not disappear", () => {
			cy.visitRoute(
				getWorkspaceRoutePreviewPath(
					appName,
					workspaceName,
					username,
					viewName
				)
			)

			cy.getWireState(
				getViewID(username, appName, viewName),
				"myViewOnlyWire"
			)
				.its("data")
				.should((obj) => {
					expect(Object.keys(obj).length).to.equal(1)
				})

			cy.clickButton("do-not-disappear")

			cy.getWireState(
				getViewID(username, appName, viewName),
				"myViewOnlyWire"
			)
				.its("data")
				.should((obj) => {
					expect(Object.keys(obj).length).to.equal(1)
				})
		})
	})
})
