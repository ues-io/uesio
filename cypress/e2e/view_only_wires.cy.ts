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
	const viewName2 = "view_only_fields"

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

			cy.clickButton("load-other-route")
			cy.title().should(
				"eq",
				"Tests View Only fields on regular or view only wires"
			)

			cy.getByIdFragment("select", "view-only-one").should((select) => {
				expect(select.children("option")).to.have.length(6)
			})
			cy.getByIdFragment("select", "view-only-one").select("AUDIO")
			cy.getByIdFragment("select", "view-only-two").should((select) => {
				expect(select.children("option")).to.have.length(3)
			})
			cy.getByIdFragment("select", "view-only-two").select("two")
			cy.getByIdFragment("select", "regular-one").should((select) => {
				expect(select.children("option")).to.have.length(6)
			})
			cy.getByIdFragment("select", "regular-two").should((select) => {
				expect(select.children("option")).to.have.length(3)
			})
			cy.getByIdFragment("select", "regular-one").select("IMAGE")
			cy.getByIdFragment("select", "regular-two").select("three")

			cy.getWireState(
				getViewID(username, appName, viewName2),
				"viewOnlyWire"
			)
				.its("data")
				.should((obj) => {
					expect(Object.keys(obj).length).to.equal(1)
					expect(obj[Object.keys(obj)[0]].selectOne).to.equal("AUDIO")
					expect(obj[Object.keys(obj)[0]].selectTwo).to.equal("two")
				})
			cy.getWireState(
				getViewID(username, appName, viewName2),
				"regularWire"
			)
				.its("data")
				.should((obj) => {
					expect(Object.keys(obj).length).to.equal(1)
					expect(obj[Object.keys(obj)[0]].selectOne).to.equal("IMAGE")
					expect(obj[Object.keys(obj)[0]].selectTwo).to.equal("three")
				})
		})
	})
})
