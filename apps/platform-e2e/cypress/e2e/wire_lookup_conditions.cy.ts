/// <reference types="cypress" />

import { getWorkspaceRoutePreviewPath } from "../support/paths"

describe("Wire Lookup Conditions", () => {
  // Use the tests app and dev workspace, which will exist if Integration Tests have been run
  const appName = "tests"
  const workspaceName = "dev"
  const username = Cypress.env("automation_username")

  before(() => {
    cy.login()
  })
  const viewName = "lookup_condition"

  context("Tests a top-level Wire Lookup condition", () => {
    it("should process top-level lookup Conditions on initial load and subsequent re-query", () => {
      cy.visitRoute(
        getWorkspaceRoutePreviewPath(
          appName,
          workspaceName,
          username,
          viewName,
        ),
      )
      cy.get("table[id$='contactsTable']>tbody>tr", {
        timeout: 4000,
      }).should("have.length", 2)

      // Now initiate a manual requery by searching
      cy.getByIdFragment("input", "contactsSearch").type("Fred")

      cy.get("table[id$='contactsTable']>tbody>tr", {
        timeout: 4000,
      }).should("have.length", 1)
    })
  })
})
