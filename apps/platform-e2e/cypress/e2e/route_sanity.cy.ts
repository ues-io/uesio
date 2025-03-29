/// <reference types="cypress" />

import { deleteApp, getUniqueAppName } from "../support/testdata"
import {
  getAppBasePath,
  getAppNamespace,
  getWorkspaceBasePath,
} from "../support/paths"

// This Suite was skipped when running in CI in this commit https://github.com/ues-io/uesio/commit/63c83343953b63aec071a4eb13ff8dfbd3996b47
// It is unclear why it is being skipped, what the failures were, etc. as the tests pass locally.  See https://github.com/ues-io/uesio/issues/4751
// For now, improving how it is skipped so that it is clearly visible in the logs that it is being skipped.
// Previously, a test was conditionally executed that logged a message saying a skip was occuring and then return
// so that no further tests would execute in the suite.  However, this approach emitted a standard log message which
// required that the logs were CLOSELY inspected to know that the tests were being skipped.  The approach below will
// ensure any tests in the suite are marked pending and appear in the test summary to increase visibility to skipped tests.
// TODO: See https://github.com/ues-io/uesio/issues/4751, resolve and enable the test in both local & CI
const conditionalDescribe = Cypress.env("in_ci") ? describe.skip : describe
conditionalDescribe("Uesio Route Sanity Tests", () => {
  // const username = Cypress.env("automation_username")

  const appName = getUniqueAppName()
  const appNamespace = getAppNamespace(appName)
  const workspace1Name = "test1"
  const workspace1BasePath = getWorkspaceBasePath(appName, workspace1Name)
  const workspace2Name = "test2"
  const workspace2BasePath = getWorkspaceBasePath(appName, workspace2Name)

  before(() => {
    cy.loginWithAppAnd2Workspaces(appName, workspace1Name, workspace2Name)
  })

  context("navigate back should preserve params", () => {
    it("navigate back should preserve params", () => {
      // Go to the first workspace
      cy.visitRoute(workspace1BasePath)
      cy.get('[id*=":uesio/io.tile:collections"]').click()
      cy.title().should("eq", "Collections")
      cy.url().should("contain", `${workspace1BasePath}/collections`)

      // Verify that the route parameters are correct
      cy.getRoute().its("params.app").should("eq", appNamespace)
      cy.getRoute()
        .its("params.workspacename")
        .should("eq", `${workspace1Name}`)
      cy.get(`a[href="${getAppBasePath(appName)}"]`).click()
      cy.url().should("contain", getAppBasePath(appName))
      cy.get(`a[href="${workspace2BasePath}"]`).click()
      cy.url().should("contain", workspace2BasePath)

      // Now navigate to the second workspace
      cy.get('[id*=":uesio/io.tile:collections"]').click()
      cy.title().should("eq", "Collections")
      cy.url().should("contain", `${workspace2BasePath}/collections`)

      // Verify that the parameters are correct
      cy.getRoute().its("params.app").should("eq", appNamespace)
      cy.getRoute()
        .its("params.workspacename")
        .should("eq", `${workspace2Name}`)

      // Now hit the back button
      cy.go("back")
      cy.url().should("contain", workspace2BasePath)
      cy.url().should("not.contain", `${workspace2BasePath}/collections`)

      // Verify that the parameters are still correct
      // (and have not mysteriously switched to the original workspace)
      cy.getRoute().its("params.app").should("eq", appNamespace)
      cy.getRoute().its("params.workspacename").should("eq", workspace2Name)
    })
  })

  after(() => {
    deleteApp(appName)
    cy.url().should("contain", `/home`)
  })
})
