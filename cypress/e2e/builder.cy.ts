/// <reference types="cypress" />

import { deleteApp, getUniqueAppName } from "../support/testdata"
import { getWorkspaceBasePath } from "../support/paths"

const initialPageDef = `# Wires connect to data in collections
wires: {}
# Components determine the layout and composition of your view
components: []
`

const addButtonPageDef = `# Wires connect to data in collections
wires: {}
# Components determine the layout and composition of your view
components:
  - uesio/io.button:
      text: New Button
      icon: bolt
      uesio.variant: uesio/io.secondary
`

const setButtonPageDef = `# Wires connect to data in collections
wires: {}
# Components determine the layout and composition of your view
components:
  - uesio/io.button:
      text: First
      icon: bolt
      uesio.variant: uesio/io.secondary
`

const cloneButtonPageDef = `# Wires connect to data in collections
wires: {}
# Components determine the layout and composition of your view
components:
  - uesio/io.button:
      text: First
      icon: bolt
      uesio.variant: uesio/io.secondary
  - uesio/io.button:
      text: First
      icon: bolt
      uesio.variant: uesio/io.secondary
`

const setButtonPageDef2 = `# Wires connect to data in collections
wires: {}
# Components determine the layout and composition of your view
components:
  - uesio/io.button:
      text: First
      icon: bolt
      uesio.variant: uesio/io.secondary
  - uesio/io.button:
      text: Second
      icon: bolt
      uesio.variant: uesio/io.secondary
`

const moveBackwardPageDef = `# Wires connect to data in collections
wires: {}
# Components determine the layout and composition of your view
components:
  - uesio/io.button:
      text: Second
      icon: bolt
      uesio.variant: uesio/io.secondary
  - uesio/io.button:
      text: First
      icon: bolt
      uesio.variant: uesio/io.secondary
`

describe("Uesio Builder Tests", () => {
	const username = Cypress.env("automation_username")

	const appName = getUniqueAppName()
	const workspaceName = "test"
	const workspaceBasePath = getWorkspaceBasePath(appName, workspaceName)

	const viewName = "testview"
	const fullViewName = `${username}/${appName}.${viewName}`
	const builderComponentId = `${fullViewName}($root):uesio/builder.mainwrapper`

	const getBuilderState = (id: string) =>
		cy.getComponentState(`${builderComponentId}:${id}`)

	const getComponentBankElement = (id: string) =>
		cy.get(`[data-type="component:${id}"]`)

	const getCanvasElement = (path: string) =>
		cy.get(`[data-path="${CSS.escape(path)}"]`)

	before(() => {
		cy.loginWithAppAndWorkspace(appName, workspaceName)
	})

	context("Create a new View", () => {
		it("creates view", () => {
			cy.visitRoute(workspaceBasePath)
			cy.get('[id*=":uesio/io.tile:views"]').click()
			cy.title().should("eq", "Views")
			cy.url().should("contain", `${workspaceBasePath}/views`)
			cy.getByIdFragment("button", "new-view").isVisible()
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
			// Check build mode
			getBuilderState("buildmode").should("be.true")
			// Check code panel toggle
			getBuilderState("codepanel").should("not.be.ok")
			cy.hotkey("{meta}y")
			getBuilderState("codepanel").should("be.true")
			// Check default view definition
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				initialPageDef
			)
			// Add a button
			getComponentBankElement("uesio/io.button").dblclick()
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				addButtonPageDef
			)
			// Select the button
			getCanvasElement('["components"]["0"]["uesio/io.button"]').click()
			// Verify the selection
			getBuilderState("selected").should(
				"eq",
				`viewdef:${fullViewName}:["components"]["0"]["uesio/io.button"]`
			)
			// Change the text property
			cy.clearInput("property:text")
			cy.typeInInput("property:text", "First")
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				setButtonPageDef
			)
			// Now Clone the button
			cy.clickButton("clone-selected")
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				cloneButtonPageDef
			)
			// Select the second button
			getCanvasElement('["components"]["1"]["uesio/io.button"]').click()
			// Change the text property again
			cy.clearInput("property:text")
			cy.typeInInput("property:text", "Second")
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				setButtonPageDef2
			)
			// Move the the second button backward
			cy.clickButton("move-backward")
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				moveBackwardPageDef
			)
			// Now move it back (This also verifies that it stays selected)
			cy.clickButton("move-forward")
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				setButtonPageDef2
			)
			// Delete the second button
			cy.clickButton("delete-selected")
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				setButtonPageDef
			)
			// Cancel the page
			cy.clickButton("cancel-builder-changes")
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				initialPageDef
			)
		})
	})

	after(() => {
		deleteApp(appName)
	})
})
