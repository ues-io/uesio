/// <reference types="cypress" />

import { getViewID } from "cypress/support/views"
import { getWorkspaceRoutePreviewPath } from "../support/paths"

describe("Search Condition", () => {
  // Use the tests app and dev workspace, which will exist if Integration Tests have been run
  const appName = "tests"
  const workspaceName = "dev"
  const username = Cypress.env("automation_username")
  const inCIEnvironment = Cypress.env("in_ci")

  before(() => {
    cy.login()
  })

  // Expected page load time in seconds
  // NOTE - this time is very variable based on how powerful the host system is, so while this may
  // consistently be twice as fast on a powerful Mac, in Github it can be 2-3 times slower. Crazy.
  const EXPECTED_PLT_SECONDS = inCIEnvironment ? 12 : 6
  const viewName = "search_condition"

  context("Test the Searchbox component & the SEARCH condition", () => {
    it("should return 2 records", () => {
      const expectedMillis = EXPECTED_PLT_SECONDS * 1000
      cy.visitRoute(
        getWorkspaceRoutePreviewPath(
          appName,
          workspaceName,
          username,
          viewName,
        ),
      )
      cy.typeInInput("table-search", "ID-007")
      cy.get("table[id$='conditionsTable']>tbody>tr", {
        timeout: expectedMillis,
      }).should("have.length", 1)

      cy.getWireState(getViewID(username, appName, viewName), "conditions")
        .its("conditions")
        .should("have.length", 1)
        .each(($condition) => {
          cy.wrap($condition).should("deep.include", {
            id: "uesio.search",
            value: "ID-007",
            type: "SEARCH",
          })
        })
    })
  })
})
