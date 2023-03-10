/// <reference types="cypress" />

import { getAppBasePath, getWorkspaceBasePath } from "../support/paths"

describe("Uesio Sanity Smoke Tests", () => {
	const username = Cypress.env("automation_username")

	const appName = "e2e" + new Date().getTime()
	const workspaceName = "test"
	const workspaceBasePath = getWorkspaceBasePath(appName, workspaceName)

	before(() => {
		cy.loginWithAppAndWorkspace(appName, workspaceName)
	})

	context("Create Collection and Fields", () => {
		it("creates collection and fields", () => {
			cy.visitRoute(workspaceBasePath)
			cy.get('[id*=":uesio/io.tile:collections"]').click()
			cy.url().should("contain", `${workspaceBasePath}/collections`)
			cy.getByIdFragment("button", "new-collection").should("be.visible")
			// Test the hotkey for creating a new collection
			cy.hotkey("n")
			// Fill out the form to create a new collection
			cy.typeInInput("new-collection-label", "Animal")
			cy.typeInInput("new-collection-plural-label", "Animals")
			cy.typeInInput("new-collection-name", "animal")
			cy.clickButton("save-new-collection")
			// Verify we get taken to the collection detail
			cy.url().should(
				"contain",
				`${workspaceBasePath}/collections/${username}/${appName}/animal`
			)
			cy.getByIdFragment("table", "fields").scrollIntoView()
			// Create a CHECKBOX field
			cy.hotkey("n")
			cy.typeInInput("new-field-name", "is_extinct")
			cy.typeInInput("new-field-label", "Is Extinct")
			cy.changeSelectValue("new-field-type", "CHECKBOX")
			cy.clickButton("save-new-field")
			// verify the field was created
			cy.get('table[id$="fields"]>tbody')
				.children("tr")
				.should("have.length", 1)
			cy.get('table[id$="fields"]>tbody>tr')
				.first()
				.children("td")
				.eq(0)
				.find("input")
				.first()
				.should("have.value", "is_extinct")
			cy.get('table[id$="fields"]>tbody>tr')
				.first()
				.children("td")
				.eq(1)
				.find("input")
				.first()
				.should("have.value", "Check Box")
			cy.get('table[id$="fields"]>tbody>tr')
				.first()
				.children("td")
				.eq(2)
				.find("input")
				.first()
				.should("have.value", "Is Extinct")
			// Create a NUMBER field
			cy.hotkey("n")
			cy.typeInInput("new-field-name", "estimated_population")
			cy.typeInInput("new-field-label", "Estimated Population")
			cy.changeSelectValue("new-field-type", "NUMBER")
			cy.typeInInput("new-field-number-decimals", "0")
			cy.hotkey("{meta}+s")
			// verify the field was created
			cy.get('table[id$="fields"]>tbody')
				.children("tr")
				.should("have.length", 2)
			cy.get('table[id$="fields"]>tbody>tr')
				.eq(1)
				.children("td")
				.eq(0)
				.find("input")
				.first()
				.should("have.value", "estimated_population")
			cy.get('table[id$="fields"]>tbody>tr')
				.eq(1)
				.children("td")
				.eq(1)
				.find("input")
				.first()
				.should("have.value", "Number")
			cy.get('table[id$="fields"]>tbody>tr')
				.eq(1)
				.children("td")
				.eq(2)
				.find("input")
				.first()
				.should("have.value", "Estimated Population")
		})
	})

	after(() => {
		cy.visitRoute(getAppBasePath(appName))
		cy.clickButton("delete-app")
		cy.clickButton("confirm-delete-app")
	})
})
