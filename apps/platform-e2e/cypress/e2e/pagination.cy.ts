/// <reference types="cypress" />

import { getWorkspaceBasePath } from "../support/paths"

describe("Pagination", () => {
  // Use the tests app and dev workspace, which will exist if Integration Tests have been run
  const appName = "tests"
  const workspaceName = "dev"

  before(() => {
    cy.login()
  })

  const getPreviousPageButton = () =>
    cy.getByIdFragment("button", "routesTable-pagination-go-to-previous-page")
  const getNextPageButton = () =>
    cy.getByIdFragment("button", "routesTable-pagination-go-to-next-page")
  const getLoadMoreButton = () =>
    cy.getByIdFragment("button", "routesTable-pagination-load-more")
  const getGoToPageButton = (number: number) =>
    cy.getByIdFragment("span", "routesTable-pagination-go-to-page-" + number)

  const verifyPaginationButtonsExist = (
    buttons: number[],
    currentPage: number,
  ) => {
    // Verify previous page
    getPreviousPageButton().should(currentPage === 1 ? "not.exist" : "exist")
    // Verify go-to-page buttons exist
    buttons.forEach((button) => {
      getGoToPageButton(button).should(
        "have.attr",
        "aria-current",
        button === currentPage ? "true" : "false",
      )
    })
  }

  context("Test pagination of the Studio Routes table", () => {
    it("should paginate and load more", () => {
      cy.visitRoute(getWorkspaceBasePath(appName, workspaceName) + "/routes")
      cy.getByIdFragment("nav", "routesTable-pagination").scrollIntoView()
      // Check pagination buttons for Page 1
      verifyPaginationButtonsExist([1, 2], 1)
      getNextPageButton().should("exist")
      getLoadMoreButton().should("not.exist")
      // Go to page 2
      cy.getByIdFragment("span", "routesTable-pagination-go-to-page-2").click()
      // Check pagination buttons for Page 2
      verifyPaginationButtonsExist([1, 2], 2)
      getNextPageButton().should("not.exist")
      getLoadMoreButton().should("exist")
      // Load more
      getLoadMoreButton().click()
      // Go to page 3
      cy.getByIdFragment("span", "routesTable-pagination-go-to-page-3").click()
      // Check pagination buttons for Page 3
      verifyPaginationButtonsExist([1, 2, 3, 4], 3)
      getNextPageButton().should("exist")
      getLoadMoreButton().should("not.exist")
      // Go back to page 2 (using previous page button)
      getPreviousPageButton().click()
      verifyPaginationButtonsExist([1, 2, 3, 4], 2)
      getNextPageButton().should("exist")
      getLoadMoreButton().should("not.exist")
      // Go back to page 3 (using next page button)
      getNextPageButton().click()
      verifyPaginationButtonsExist([1, 2, 3, 4], 3)
      getNextPageButton().should("exist")
      getLoadMoreButton().should("not.exist")
    })
  })
})
