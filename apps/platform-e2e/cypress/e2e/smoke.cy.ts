/// <reference types="cypress" />

import { deleteApp, getUniqueAppName } from "../support/testdata"
import { getAppNamespace, getWorkspaceBasePath } from "../support/paths"

describe("Uesio Sanity Smoke Tests", () => {
  // const username = Cypress.env("automation_username")

  const appName = getUniqueAppName()
  const namespace = getAppNamespace(appName)
  const workspaceName = "test"
  const workspaceBasePath = getWorkspaceBasePath(appName, workspaceName)
  
  // This test is too flaky to be run in CI
  // TODO: Investigate why this doesn't work well in CI
  if (Cypress.env("in_ci")) {
    it("test disabled in CI environments due to flakiness", () => {
      cy.log("skipping test in mock login mode")
    })
    return
  }

  before(() => {
    cy.loginWithAppAndWorkspace(appName, workspaceName)
  })

  context("Create Collection and Fields", () => {
    it("creates collection and fields", () => {
      cy.visitRoute(workspaceBasePath)
      cy.get('[id*=":uesio/io.tile:collections"]').click()
      cy.title().should("eq", "Collections")
      cy.url().should("contain", `${workspaceBasePath}/collections`)
      cy.getByIdFragment("button", "new-collection").scrollIntoView()
      cy.getByIdFragment("button", "new-collection").should("be.visible")
      // Click the new collection button
      cy.clickButton("new-collection")
      // Fill out the form to create a new collection
      cy.typeInInput("new-collection-name", "animal").blur()
      cy.getByIdFragment("input", "new-collection-label").should(
        "have.value",
        "animal",
      )
      cy.getByIdFragment("input", "new-collection-plural-label").should(
        "have.value",
        "animals",
      )
      cy.clickButton("save-new-collection")
      // Verify we get taken to the collection detail
      cy.url().should(
        "contain",
        `${workspaceBasePath}/collections/${namespace}/animal`,
      )
      cy.title().should("eq", "Collection: animal")
      cy.getByIdFragment("table", "fields").scrollIntoView()
      // Initially there should be no fields
      cy.get('table[id$="fields"]>tbody')
        .children("tr")
        .should("have.length", 0)
      // Create a CHECKBOX field
      // Click the new field button
      cy.clickButton("new-field")
      cy.typeInInput("new-field-name", "is_extinct")
      cy.getByIdFragment("input", "new-field-name").blur()
      cy.getByIdFragment("input", "new-field-label").should(
        "have.value",
        "is_extinct",
      )
      cy.getByIdFragment("input", "new-field-label").clear()
      cy.typeInInput("new-field-label", "Is Extinct")
      cy.changeSelectValue("new-field-type", "CHECKBOX")
      cy.clickButton("save-field-and-add-another")
      //Save takes time so this was to fast
      // eslint-disable-next-line cypress/no-unnecessary-waiting -- TODO: Eliminate arbitrary wait
      cy.wait(500)
      // Create a NUMBER field
      cy.typeInInput("new-field-name", "estimated_population")
      cy.getByIdFragment("input", "new-field-name").blur()
      cy.getByIdFragment("input", "new-field-label").should(
        "have.value",
        "estimated_population",
      )
      cy.getByIdFragment("input", "new-field-label").clear()
      cy.typeInInput("new-field-label", "Estimated Population")
      cy.changeSelectValue("new-field-type", "NUMBER")
      cy.typeInInput("new-field-number-decimals", "0")
      cy.clickButton("save-field-and-close")
      // verify the 2 fields were created
      cy.get('table[id$="fields"]>tbody')
        .children("tr")
        .should("have.length", 2)
      cy.hasExpectedTableField(
        "fields",
        0,
        "estimated_population",
        namespace,
        "Number",
        "Estimated Population",
      )
      cy.hasExpectedTableField(
        "fields",
        1,
        "is_extinct",
        namespace,
        "Check Box",
        "Is Extinct",
      )
      // Search the table to find one field
      cy.get("input[type=search]").scrollIntoView()
      cy.get("input[type=search]").type("ext")
      // verify that only one result is returned
      cy.get('table[id$="fields"]>tbody')
        .children("tr")
        .should("have.length", 1)
      cy.hasExpectedTableField(
        "fields",
        0,
        "is_extinct",
        namespace,
        "Check Box",
        "Is Extinct",
      )
      // Clear the search to verify that both results come back
      cy.get("input[type=search]").scrollIntoView()
      cy.get("input[type=search]").clear()
      cy.get('table[id$="fields"]>tbody')
        .children("tr")
        .should("have.length", 2)

      // Mark a field for deletion
      cy.get('table[id$="fields"]>tbody')
        .children("tr")
        .eq(0)
        .children("td")
        .eq(4)
        .find(".rowaction")
        .eq(1)
        .click()
      // Save
      cy.hotkey("{meta}s")
      // Verify the correct field was deleted
      cy.get('table[id$="fields"]>tbody')
        .children("tr")
        .should("have.length", 1)
      cy.hasExpectedTableField(
        "fields",
        0,
        "is_extinct",
        namespace,
        "Check Box",
        "Is Extinct",
      )
      // Verify that the common fields table has the expected number of fields
      cy.getByIdFragment("table", "commonFields").scrollIntoView()
      // Initially there should be no fields
      cy.get('table[id$="commonFields"]>tbody')
        .children("tr")
        // TODO: Unclear why this assert exists as its fragile and likely does not help in any way since underlying
        // data can change across the test suite.  Evaluate this tests purpose and adjust the assert to be
        // explicit/more meaningful, for example assert that the specific fields we expect to be there are there.      
        .should("have.length", 8)
    })
  })

  after(() => {
    deleteApp(appName)
    cy.url().should("contain", `/home`)
  })
})
