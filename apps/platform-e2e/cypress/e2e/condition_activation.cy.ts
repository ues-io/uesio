/// <reference types="cypress" />

import { getViewID } from "../support/views"
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

  const assertConditionState = (inactive: boolean, value: string) => {
    cy.getWireState(getViewID(username, appName, viewName), "conditions")
      .its("conditions")
      .should("have.length", 2)
      .each(($condition) => {
        cy.wrap($condition).should("deep.include", {
          field: "uesio/tests.name",
          value,
          inactive,
          id: "one",
        })
      })
  }
  const getTableRows = () => cy.get("table[id$='conditionsTable']>tbody>tr")

  context("Tests inactive conditions on load and subsequent activation", () => {
    it("should not process inactive conditions on load, but allow activation", () => {
      cy.visitRoute(
        getWorkspaceRoutePreviewPath(
          appName,
          workspaceName,
          username,
          viewName,
        ),
      )
      getTableRows().should("have.length.above", 1)
      assertConditionState(true, "ID-002")

      // Toggle the condition to active
      cy.clickButton("toggleCondition")

      // We should now have exactly one record in our table
      getTableRows().should("have.length", 1)
      // And the condition should be active
      assertConditionState(false, "ID-002")

      // Toggle the condition back to inactive
      cy.clickButton("toggleCondition")
      getTableRows().should("have.length.above", 1)
      assertConditionState(true, "ID-002")

      // Change the condition value, which should also activate it again
      cy.clickButton("setConditionValue")
      getTableRows().should("have.length", 1)
      assertConditionState(false, "ID-003")

      // Reset all named conditions, which should deactivate the named condition
      cy.clickButton("resetNamedConditions")
      getTableRows().should("have.length.above", 1)
      assertConditionState(true, "ID-002")
    })
  })
})
