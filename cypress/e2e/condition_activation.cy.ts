/// <reference types="cypress" />

import { getViewID } from "cypress/support/views"
import { getWorkspaceRoutePreviewPath } from "../support/paths"

describe("Condition activation/deactivation", () => {
	// Use the tests app and dev workspace, which will exist if Integration Tests have been run
	const appName = "tests"
	const workspaceName = "dev"
	const username = Cypress.env("automation_username")

	before(() => {
		cy.login()
	})

	const viewName = "condition_activation"

	const assertConditionInactive = (inactive: boolean) => {
		cy.getWireState(getViewID(username, appName, viewName), "conditions")
			.its("conditions")
			.should("have.length", 1)
			.each(($condition) => {
				cy.wrap($condition).should("deep.include", {
					field: "uesio/tests.name",
					value: "ID-002",
					inactive,
					id: "id002",
				})
			})
	}
	const getTableRows = () => cy.get("table[id$='conditionsTable']>tbody>tr")

	context(
		"Tests inactive conditions on load and subsequent activation",
		() => {
			it("should not process inactive conditions on load, but allow activation", () => {
				cy.visitRoute(
					getWorkspaceRoutePreviewPath(
						appName,
						workspaceName,
						username,
						viewName
					)
				)
				getTableRows().should("have.length.above", 1)
				assertConditionInactive(true)

				// Toggle the condition to active
				cy.clickButtonIfExists("toggleCondition")

				// We should now have exactly one record in our table
				getTableRows().should("have.length", 1)
				// And the condition should be active
				assertConditionInactive(false)

				// Toggle the condition back to inactive
				cy.clickButtonIfExists("toggleCondition")
				getTableRows().should("have.length.above", 1)
				assertConditionInactive(true)
			})
		}
	)
})
