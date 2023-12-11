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
      uesio.variant: uesio/io.default
      iconPlacement: start
`

const add2ButtonPageDef = `# Wires connect to data in collections
wires: {}
# Components determine the layout and composition of your view
components:
  - uesio/io.button:
      text: New Button
      icon: bolt
      uesio.variant: uesio/io.default
      iconPlacement: start
  - uesio/io.button:
      text: New Button
      icon: bolt
      uesio.variant: uesio/io.default
      iconPlacement: start
`

const setButtonPageDef = `# Wires connect to data in collections
wires: {}
# Components determine the layout and composition of your view
components:
  - uesio/io.button:
      text: First
      icon: bolt
      uesio.variant: uesio/io.default
      iconPlacement: start
`

const cloneButtonPageDef = `# Wires connect to data in collections
wires: {}
# Components determine the layout and composition of your view
components:
  - uesio/io.button:
      text: First
      icon: bolt
      uesio.variant: uesio/io.default
      iconPlacement: start
  - uesio/io.button:
      text: First
      icon: bolt
      uesio.variant: uesio/io.default
      iconPlacement: start
`

const setButtonPageDef2 = `# Wires connect to data in collections
wires: {}
# Components determine the layout and composition of your view
components:
  - uesio/io.button:
      text: First
      icon: bolt
      uesio.variant: uesio/io.default
      iconPlacement: start
  - uesio/io.button:
      text: Second
      icon: bolt
      uesio.variant: uesio/io.default
      iconPlacement: start
`

const moveBackwardPageDef = `# Wires connect to data in collections
wires: {}
# Components determine the layout and composition of your view
components:
  - uesio/io.button:
      text: Second
      icon: bolt
      uesio.variant: uesio/io.default
      iconPlacement: start
  - uesio/io.button:
      text: First
      icon: bolt
      uesio.variant: uesio/io.default
      iconPlacement: start
`

const addBoxPageDef = `# Wires connect to data in collections
wires: {}
# Components determine the layout and composition of your view
components:
  - uesio/io.box: {}
`

const addBoxInBoxPageDef = `# Wires connect to data in collections
wires: {}
# Components determine the layout and composition of your view
components:
  - uesio/io.box:
      components:
        - uesio/io.box: {}
`

describe("Uesio Builder Tests", () => {
	const username = Cypress.env("automation_username")

	const appName = getUniqueAppName()
	const workspaceName = "test"
	const workspaceBasePath = getWorkspaceBasePath(appName, workspaceName)

	const viewName = "testview"
	const namespace = `${username}/${appName}`
	const fullViewName = `${namespace}.${viewName}`
	const builderComponentId = `${fullViewName}($root):uesio/builder.mainwrapper`

	const getBuilderState = (id: string) =>
		cy.getComponentState(`${builderComponentId}:${id}`)

	const getComponentBankElement = (
		type: string,
		id: string,
		variantId?: string
	) => {
		const dataType = `${type}:${id}${
			type === "componentvariant" && variantId ? `:${variantId}` : ""
		}`
		return cy.get(`[data-type="${CSS.escape(dataType)}"]`)
	}

	const getCanvasElement = (slotpath: string, index: number) =>
		cy
			.get(`[data-path="${CSS.escape(slotpath)}"]`)
			.children(`[data-index="${index}"]`)
			.children()
			.first()

	before(() => {
		cy.loginWithAppAndWorkspace(appName, workspaceName)
	})

	context("Create a new View", () => {
		it("creates view", () => {
			cy.visitRoute(workspaceBasePath)
			cy.get('[id*=":uesio/io.tile:views"]').click()
			cy.title().should("eq", "Views")
			cy.url().should("contain", `${workspaceBasePath}/views`)
			cy.getByIdFragment("button", "new-view")
				.scrollIntoView()
				.should("be.visible")
			// Click the new view button
			cy.clickButton("new-view")
			// Fill out the form to create a new view
			cy.typeInInput("new-view-name", viewName)
			cy.clickButton("save-new-view")
			// Verify we get taken to the collection detail
			cy.url().should(
				"contain",
				`${workspaceBasePath}/views/${namespace}/${viewName}`
			)
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

			// Search for button component
			cy.get("#builder-components-search").type("button")

			// Add a button
			getComponentBankElement("component", "uesio/io.button").dblclick()
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				addButtonPageDef
			)
			// Cancel the page - to verify cancel behavior
			cy.clickButton("cancel-builder-changes")
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				initialPageDef
			)

			// Search for button component
			cy.get("#builder-components-search").clear().type("box")

			// Now test doubleclicking
			getComponentBankElement("component", "uesio/io.box").dblclick()
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				addBoxPageDef
			)

			// Select the box
			getCanvasElement('["components"]', 0).click()
			// Verify the selection
			getBuilderState("selected").should(
				"eq",
				`viewdef:${fullViewName}:["components"]["0"]["uesio/io.box"]`
			)

			getComponentBankElement("component", "uesio/io.box").dblclick()
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				addBoxInBoxPageDef
			)

			// Cancel the page - to verify cancel behavior
			cy.clickButton("cancel-builder-changes")
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				initialPageDef
			)

			// Now test doubleclicking where the selected path is invalid
			getComponentBankElement("component", "uesio/io.box").dblclick()
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				addBoxPageDef
			)

			// Cancel the page - to verify cancel behavior
			cy.clickButton("cancel-builder-changes")
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				initialPageDef
			)

			// Search for button component
			cy.get("#builder-components-search").clear().type("button")

			// Now test doubleclicking a button
			// (This is different than io.box because buttons don't have slots)
			getComponentBankElement("component", "uesio/io.button").dblclick()
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				addButtonPageDef
			)

			//Close again the code panel & the index so the button is visible
			//and the clone button does not appear twice on the view.
			cy.hotkey("{meta}y")
			getBuilderState("codepanel").should("not.be.ok")
			cy.hotkey("{meta}i")
			getBuilderState("indexpanel").should("not.be.ok")

			// Select the button
			getCanvasElement('["components"]', 0).click()
			// Verify the selection
			getBuilderState("selected").should(
				"eq",
				`viewdef:${fullViewName}:["components"]["0"]["uesio/io.button"]`
			)

			getComponentBankElement("component", "uesio/io.button").dblclick()
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				add2ButtonPageDef
			)

			// Cancel the page - to verify cancel behavior
			cy.clickButton("cancel-builder-changes")
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				initialPageDef
			)

			// Select the component type
			getComponentBankElement("component", "uesio/io.button")
				.find("button")
				.first()
				.click({ force: true })
			// Add the button (again), but double click on the default variant to test that
			// you can add double-click to add variants
			getComponentBankElement(
				"componentvariant",
				"uesio/io.button",
				"uesio/io.default"
			).dblclick()
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				addButtonPageDef
			)
			// Select the button
			getCanvasElement('["components"]', 0).click()
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
			getCanvasElement('["components"]', 1).click({
				force: true,
			})
			// Change the text property again
			cy.getInput("property:text").should("have.value", "First")
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
			// Save the page
			cy.clickButton("save-builder-changes")
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				setButtonPageDef
			)
			// Refresh the page to verify that our view saved
			cy.reload()
			// Verify that the state is still the same
			getBuilderState(`metadata:viewdef:${fullViewName}`).should(
				"eq",
				setButtonPageDef
			)
		})
	})

	after(() => {
		deleteApp(appName)
	})
})
