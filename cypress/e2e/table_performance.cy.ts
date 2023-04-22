/// <reference types="cypress" />

import { getWorkspaceRoutePreviewPath } from "../support/paths"

describe("Table Performance tests", () => {
	// Use the tests app and dev workspace, which will exist if Integration Tests have been run
	const appName = "tests"
	const workspaceName = "dev"
	const username = Cypress.env("automation_username")

	before(() => {
		cy.login()
	})

	// Expected page load time
	const EXPECTED_PLT_SECONDS = 5

	context("Check Table component performance", () => {
		it(`should render table with 500 rows and 8 columns in < ${EXPECTED_PLT_SECONDS} seconds`, () => {
			let t0 = 0
			cy.then(() => {
				t0 = performance.now()
			})
			cy.visitRoute(
				getWorkspaceRoutePreviewPath(
					appName,
					workspaceName,
					username,
					"table_with_lots_of_rows"
				)
			)
			cy.get("table[id$='animals']>tbody>tr", {
				timeout: 5000,
			})
				.should("have.length", 500)
				.then(() => {
					const t1 = performance.now()
					const pageLoadMillis = t1 - t0
					cy.log(`Page load took ${pageLoadMillis} milliseconds.`)
					expect(pageLoadMillis).to.be.lessThan(
						EXPECTED_PLT_SECONDS * 1000
					)
				})
		})
	})
})
