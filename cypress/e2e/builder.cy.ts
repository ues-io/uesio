/// <reference types="cypress" />

import { getAppBasePath, getWorkspaceBasePath } from "../support/paths"

describe("Uesio Builder Tests", () => {
	const username = Cypress.env("automation_username")

	const appName = "e2e" + new Date().getTime()
	const workspaceName = "test"
	const workspaceBasePath = getWorkspaceBasePath(appName, workspaceName)

	const viewName = "testview"

	const builderComponentId = `${username}/${appName}.${viewName}($root):uesio/builder.mainwrapper`

	const getBuilderState = (id: string) =>
		cy.getComponentState(`${builderComponentId}:${id}`)

	before(() => {
		cy.loginWithAppAndWorkspace(appName, workspaceName)
	})

	context("Create a new View", () => {
		it("creates view", () => {
			cy.visitRoute(workspaceBasePath)
			cy.get('[id*=":uesio/io.tile:views"]').click()
			cy.title().should("eq", "Views")
			cy.url().should("contain", `${workspaceBasePath}/views`)
			cy.getByIdFragment("button", "new-view").should("be.visible")
			// Test the hotkey for creating a new view
			cy.hotkey("n")
			// Fill out the form to create a new view
			cy.typeInInput("new-view-name", viewName)
			cy.clickButton("save-new-view")
			// Verify we get taken to the collection detail
			cy.url().should("contain", `${workspaceBasePath}/views/${viewName}`)
			cy.title().should("eq", `View: ${viewName}`)
			// Go into the builder
			cy.clickButton("build-view")
			cy.url().should("contain", `/edit`)
			getBuilderState("buildmode").should("be.true")
			getBuilderState("codepanel").should("not.be.ok")
			cy.hotkey("{meta}y")
			getBuilderState("codepanel").should("be.true")
		})
	})

	after(() => {
		cy.visitRoute(getAppBasePath(appName))
		cy.clickButton("delete-app")
		cy.clickButton("confirm-delete-app")
	})
})
