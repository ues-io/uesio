/// <reference types="cypress" />

import { getWorkspaceRoutePreviewPath } from "../support/paths"

describe("Table Performance tests", () => {
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
  const EXPECTED_PLT_SECONDS = inCIEnvironment ? 12 : 4

  context("Check Table component performance", () => {
    it(`should render table with 400 rows and 8 columns in < ${EXPECTED_PLT_SECONDS} seconds`, () => {
      const expectedMillis = EXPECTED_PLT_SECONDS * 1000
      let t0 = 0
      cy.then(() => {
        t0 = performance.now()
      })
      cy.visitRoute(
        getWorkspaceRoutePreviewPath(
          appName,
          workspaceName,
          username,
          "table_with_lots_of_rows",
        ),
      )
      cy.get("table[id$='animalsTable']>tbody>tr", {
        timeout: expectedMillis,
      })
        .should("have.length", 400)
        .then(() => {
          const t1 = performance.now()
          const pageLoadMillis = t1 - t0
          cy.log(`Page load took ${pageLoadMillis} milliseconds.`)
          expect(pageLoadMillis).to.be.lessThan(expectedMillis)
        })
    })
  })
})
