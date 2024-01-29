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
				expect(select.children("option")).to.have.length(4)
				expect(select.children("option").eq(0)).to.have.text(
					"Select an option"
				)
				expect(select.children("option").eq(1)).to.have.text("One")
			})
			cy.getByIdFragment("select", "view-only-two").select("two")
			cy.getByIdFragment("select", "regular-one").should((select) => {
				expect(select.children("option")).to.have.length(6)
			})
			cy.getByIdFragment("select", "regular-two").should((select) => {
				expect(select.children("option")).to.have.length(4)
				expect(select.children("option").eq(0)).to.have.text("")
				expect(select.children("option").eq(1)).to.have.text("One")
			})
			cy.getByIdFragment("select", "regular-one").select("IMAGE")
			cy.getByIdFragment("select", "regular-two").select("three")
			// When IMAGE is selected, the Media Sub Type field should only allow selection of Image types
			cy.getByIdFragment("select", "media-sub-type").should((select) => {
				// The first option should be a blank option,
				// and the second should be an <optgroup> with the label "Image Type"
				expect(select.children()).to.have.length(2)
				expect(select.children("option").eq(0)).to.have.text("")
				expect(
					select.children("optgroup").eq(0).attr("label")
				).to.equal("Image Type")
				expect(
					select.children("optgroup").children("option")
				).to.have.length(3)
				expect(
					select.children("optgroup").children("option").eq(0)
				).to.have.text("JPG")
				expect(
					select.children("optgroup").children("option").eq(0)
				).to.have.value("jpeg")
			})

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

			// When AUDIO is selected, a different set of options should be presented
			cy.getByIdFragment("select", "regular-one").select("AUDIO")
			cy.getByIdFragment("select", "media-sub-type").should((select) => {
				// The first option should be a blank option,
				// and the second should be an <optgroup> with the label "Audio Type"
				expect(select.children()).to.have.length(2)
				expect(select.children("option").eq(0)).to.have.text("")
				expect(
					select.children("optgroup").eq(0).attr("label")
				).to.equal("Audio Type")
				expect(
					select.children("optgroup").children("option")
				).to.have.length(3)
				expect(
					select.children("optgroup").children("option").eq(0)
				).to.have.text("MP3")
				expect(
					select.children("optgroup").children("option").eq(0)
				).to.have.value("mp3")
			})
		})
	})
})
