/// <reference types="cypress" />

import { deleteApp, getUniqueAppName } from "../support/testdata"
import { getAppNamespace, getWorkspaceBasePath } from "../support/paths"

describe("Uesio Sanity Smoke Tests", () => {
	// const username = Cypress.env("automation_username")

	const appName = getUniqueAppName()
	const namespace = getAppNamespace(appName)
	const workspaceName = "test"
	const workspaceBasePath = getWorkspaceBasePath(appName, workspaceName)
	const NUM_COMMON_FIELDS = 7

	before(() => {
		cy.loginWithAppAndWorkspace(appName, workspaceName)
	})

	context("Create Collection and Fields", () => {
		it("creates collection and fields", () => {
			cy.visitRoute(workspaceBasePath)
			cy.get('[id*=":uesio/io.tile:collections"]').click()
			cy.title().should("eq", "Collections")
			cy.url().should("contain", `${workspaceBasePath}/collections`)
			cy.getByIdFragment("button", "new-collection")
				.scrollIntoView()
				.should("be.visible")
			// Click the new collection button
			cy.clickButton("new-collection")
			// Fill out the form to create a new collection
			cy.typeInInput("new-collection-name", "animal").blur()
			cy.getByIdFragment("input", "new-collection-label").should(
				"have.value",
				"animal"
			)
			cy.getByIdFragment("input", "new-collection-plural-label").should(
				"have.value",
				"animals"
			)
			cy.clickButton("save-new-collection")
			// Verify we get taken to the collection detail
			cy.url().should(
				"contain",
				`${workspaceBasePath}/collections/${namespace}/animal`
			)
			cy.title().should("eq", "Collection: animal")
			cy.getByIdFragment("table", "fields").scrollIntoView()
			// Initially there should be no fields
			cy.get('table[id$="fields"]>tbody')
				.children("tr")
				.should("have.length", 0)
			// Create a CHECKBOX field
			// Click the new field button
			cy.clickButton("new-field")
			cy.typeInInput("new-field-name", "is_extinct")
			cy.getByIdFragment("input", "new-field-name").blur()
			cy.getByIdFragment("input", "new-field-label").should(
				"have.value",
				"is_extinct"
			)
			cy.getByIdFragment("input", "new-field-label").clear()
			cy.typeInInput("new-field-label", "Is Extinct")
			cy.changeSelectValue("new-field-type", "CHECKBOX")
			cy.clickButton("save-field-and-add-another")
			// Create a NUMBER field
			cy.typeInInput("new-field-name", "estimated_population")
			cy.getByIdFragment("input", "new-field-name").blur()
			cy.getByIdFragment("input", "new-field-label").should(
				"have.value",
				"estimated_population"
			)
			cy.getByIdFragment("input", "new-field-label").clear()
			cy.typeInInput("new-field-label", "Estimated Population")
			cy.changeSelectValue("new-field-type", "NUMBER")
			cy.typeInInput("new-field-number-decimals", "0")
			cy.clickButton("save-field-and-close")
			// verify the 2 fields were created
			cy.get('table[id$="fields"]>tbody')
				.children("tr")
				.should("have.length", 2)
			cy.hasExpectedTableField(
				"fields",
				0,
				"estimated_population",
				namespace,
				"Number",
				"Estimated Population"
			)
			cy.hasExpectedTableField(
				"fields",
				1,
				"is_extinct",
				namespace,
				"Check Box",
				"Is Extinct"
			)
			// Mark a field for deletion
			cy.get('table[id$="fields"]>tbody')
				.children("tr")
				.eq(0)
				.children("td")
				.eq(4)
				.find("button.rowaction")
				.eq(1)
				.click()
			// Save
			cy.hotkey("{meta}s")
			// Verify the correct field was deleted
			cy.get('table[id$="fields"]>tbody')
				.children("tr")
				.should("have.length", 1)
			cy.hasExpectedTableField(
				"fields",
				0,
				"is_extinct",
				namespace,
				"Check Box",
				"Is Extinct"
			)
			// Verify that the common fields table has the expected number of fields
			cy.getByIdFragment("table", "commonFields").scrollIntoView()
			// Initially there should be no fields
			cy.get('table[id$="commonFields"]>tbody')
				.children("tr")
				.should("have.length", NUM_COMMON_FIELDS)
		})
	})

	after(() => {
		deleteApp(appName)
	})
})
