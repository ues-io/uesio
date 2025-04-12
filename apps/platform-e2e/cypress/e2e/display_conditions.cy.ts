/// <reference types="cypress" />

import { getWorkspaceRoutePreviewPath } from "../support/paths"

describe("Display Conditions", () => {
  // Use the tests app and dev workspace, which will exist if Integration Tests have been run
  const appName = "tests"
  const workspaceName = "dev"
  const username = Cypress.env("automation_username")

  beforeEach(() => {
    cy.login()
  })
  const routeName = "display_conditions"
  const routePath = getWorkspaceRoutePreviewPath(
    appName,
    workspaceName,
    username,
    routeName,
  )

  it("should conditionally display components", () => {
    cy.visitRoute(routePath)
    cy.getByIdFragment("button", "btn-create").should("have.length", 1)
    cy.getByIdFragment("button", "btn-save").should("have.length", 0)
    cy.getByIdFragment("button", "btn-cancel").should("have.length", 0)
    cy.getByIdFragment("span", "text-paramIsSet").should("have.length", 0)
    cy.getByIdFragment("span", "text-paramIsNotSet").should("have.length", 1)
    cy.getByIdFragment("span", "text-paramValue-notEquals").should(
      "have.length",
      2,
    )
    cy.getByIdFragment("span", "text-paramValue-equals").should(
      "have.length",
      0,
    )
    cy.getByIdFragment("span", "text-paramValueEqualsOrWireHasChanges").should(
      "have.length",
      0,
    )
    // Create a record so that the wire has changes. This should cause conditional display to reevaluate
    cy.clickButton("btn-create")
    cy.getByIdFragment("button", "btn-create").should("have.length", 0)
    cy.getByIdFragment("button", "btn-save").should("have.length", 1)
    cy.getByIdFragment("button", "btn-cancel").should("have.length", 1)
    cy.getByIdFragment("span", "text-paramValueEqualsOrWireHasChanges").should(
      "have.length",
      1,
    )
    // Cancel changes. This should cause conditional display to reevaluate
    cy.clickButton("btn-cancel")
    cy.getByIdFragment("button", "btn-create").should("have.length", 1)
    cy.getByIdFragment("button", "btn-save").should("have.length", 0)
    cy.getByIdFragment("button", "btn-cancel").should("have.length", 0)
    cy.getByIdFragment("span", "text-paramValueEqualsOrWireHasChanges").should(
      "have.length",
      0,
    )
  })

  it("should conditionally display based on param values", () => {
    cy.visitRoute(`${routePath}?foo=bar`)
    cy.getByIdFragment("span", "text-paramIsSet").should("have.length", 1)
    cy.getByIdFragment("span", "text-paramIsNotSet").should("have.length", 0)
    cy.getByIdFragment("span", "text-paramValue-notEquals").should(
      "have.length",
      0,
    )
    cy.getByIdFragment("span", "text-paramValue-equals").should(
      "have.length",
      1,
    )
    cy.getByIdFragment("span", "text-paramValueEqualsOrWireHasChanges").should(
      "have.length",
      1,
    )
  })
})
