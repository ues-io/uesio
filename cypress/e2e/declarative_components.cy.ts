/// <reference types="cypress" />

import { getWorkspaceRoutePreviewPath } from "../support/paths"

describe("Declarative Components", () => {
	// Use the tests app and dev workspace, which will exist if Integration Tests have been run
	const appName = "tests"
	const workspaceName = "dev"
	const username = Cypress.env("automation_username")
	const routePath1 = "declarative1"

	before(() => {
		cy.login()
	})

	const declarative1Tests = () => {
		cy.get("div#root").should("contain", "Such declarative")
		cy.get("div#root").should("contain", "Much magic")
	}
	const declarative2Tests = () => {
		cy.get("div#root").should("contain", "I am on the left")
		cy.get("div#root").should("contain", "I am on the right")
		cy.get("div#root").should("contain", "This is the header")
		cy.get("div#root").should("contain", "And this is the footer")
	}

	const runTests = () => {
		declarative1Tests()
		cy.clickButtonIfExists("btn-go-to-view2")
		cy.url().should("contain", "declarative2")
		declarative2Tests()
		cy.clickButtonIfExists("btn-go-to-view1")
		cy.url().should("contain", "declarative1")
		declarative1Tests()
	}

	context("Test loading of declarative Components in a View", () => {
		it("should load declarative components in workspace mode", () => {
			cy.visitRoute(
				getWorkspaceRoutePreviewPath(
					appName,
					workspaceName,
					username,
					routePath1
				)
			)
			runTests()
		})
	})
})
