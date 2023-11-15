/// <reference types="cypress" />

import { deleteApp, getUniqueAppName } from "../support/testdata"
import {
	getAppBasePath,
	getAppNamespace,
	getWorkspaceBasePath,
} from "../support/paths"

describe("Uesio Route Sanity Tests", () => {
	// const username = Cypress.env("automation_username")

	const appName = getUniqueAppName()
	const appNamespace = getAppNamespace(appName)
	const workspace1Name = "test1"
	const workspace1BasePath = getWorkspaceBasePath(appName, workspace1Name)
	const workspace2Name = "test2"
	const workspace2BasePath = getWorkspaceBasePath(appName, workspace2Name)

	before(() => {
		cy.loginWithAppAnd2Workspaces(appName, workspace1Name, workspace2Name)
	})

	context("navigate back should preserve params", () => {
		it("navigate back should preserve params", () => {
			// Go to the first workspace
			cy.visitRoute(workspace1BasePath)
			cy.get('[id*=":uesio/io.tile:collections"]').click()
			cy.title().should("eq", "Collections")
			cy.url().should("contain", `${workspace1BasePath}/collections`)

			// Verify that the route parameters are correct
			cy.getRoute().its("params.app").should("eq", appNamespace)
			cy.getRoute()
				.its("params.workspacename")
				.should("eq", `${workspace1Name}`)
			cy.get(`a[href="${getAppBasePath(appName)}"]`).click()
			cy.url().should("contain", getAppBasePath(appName))
			cy.get(`a[href="${workspace2BasePath}"]`).click()
			cy.url().should("contain", workspace2BasePath)

			// Now navigate to the second workspace
			cy.get('[id*=":uesio/io.tile:collections"]').click()
			cy.title().should("eq", "Collections")
			cy.url().should("contain", `${workspace2BasePath}/collections`)

			// Verify that the parameters are correct
			cy.getRoute().its("params.app").should("eq", appNamespace)
			cy.getRoute()
				.its("params.workspacename")
				.should("eq", `${workspace2Name}`)

			// Now hit the back button
			cy.go("back")
			cy.getRoute().its("isLoading").should("eq", true)
			cy.url().should("contain", workspace2BasePath)
			cy.url().should("not.contain", `${workspace2BasePath}/collections`)

			// Verify that the parameters are still correct
			// (and have not mysteriously switched to the original workspace)
			cy.getRoute().its("params.app").should("eq", appNamespace)
			cy.getRoute().its("isLoading").should("be.undefined")
			cy.getRoute()
				.its("params.workspacename")
				.should("eq", workspace2Name)
		})
	})

	after(() => {
		deleteApp(appName)
	})
})
