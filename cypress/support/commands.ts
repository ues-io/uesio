/// <reference types="cypress" />
// ***********************************************
// This file creates various custom commands
// can be called on the cy object, e.g. cy.login()
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

import { getAppBasePath, getWorkspaceBasePath } from "./paths"

const baseUrl = Cypress.env("studio_base_url")
const useMockLogin = Cypress.env("use_mock_login")
const automationUsername = Cypress.env("automation_username")
const automationPassword = Cypress.env("automation_password")
const idContainsSelector = (el: string, idFragment: string) =>
	`${el}[id*=":${idFragment}"]`

// Logs in to the app
// and creates an App and Workspace to use for subsequent tests
Cypress.Commands.add(
	"loginWithAppAndWorkspace",
	(appName: string, workspaceName: string) => {
		// Caching session when logging in via page visit
		cy.session("automationSession1", () => {
			login()
			createApp(appName)
			createWorkspaceInApp(workspaceName, appName)
		})
	}
)

// Just logs in to the app
Cypress.Commands.add("login", () => {
	cy.session("automationSession2", login)
})

// Gets an element of a given type whose id contains a given string
Cypress.Commands.add(
	"getByIdFragment",
	(elementType: string, idFragment: string, timeout?: number) => {
		cy.get(idContainsSelector(elementType, idFragment), { timeout })
	}
)

// Gets an input element whose id contains a given string, and types a string into it
Cypress.Commands.add("typeInInput", (idFragment: string, value: string) => {
	cy.get(idContainsSelector("input", idFragment)).type(value)
})

// Clears an input element whose id contains a given string
Cypress.Commands.add("clearInput", (idFragment: string) => {
	cy.get(idContainsSelector("input", idFragment)).clear()
})

// Changes the value of a <select>
Cypress.Commands.add(
	"changeSelectValue",
	(selectElementIdFragment: string, value: string) => {
		cy.get(idContainsSelector("select", selectElementIdFragment)).select(
			value
		)
	}
)

// Clicks on a button element whose id contains a given string
Cypress.Commands.add("clickButton", (idFragment: string) => {
	const buttonSelector = idContainsSelector("button", idFragment)
	const anchorSelector = idContainsSelector("a", idFragment)
	cy.get(`${buttonSelector},${anchorSelector}`).click()
})

// Checks if a given button exists in the DOM, and clicks on it if is found
Cypress.Commands.add("clickButtonIfExists", (idFragment: string) => {
	const buttonSelector = idContainsSelector("button", idFragment)
	const anchorSelector = idContainsSelector("a", idFragment)
	const selector = `${buttonSelector},${anchorSelector}`
	clickIfExists(selector)
})

function clickIfExists(selector: string) {
	cy.get("body").then((body) => {
		if (body.find(selector).length > 0) {
			cy.get(selector).click()
		}
	})
}

// Checks a component state
Cypress.Commands.add("getComponentState", (componentId: string) => {
	cy.window()
		.its("uesio.api.component")
		.invoke("getExternalState", componentId)
})

// Enters a global hotkey
Cypress.Commands.add("hotkey", (hotkey: string) => {
	cy.get("body").type(hotkey)
})

// Use this for all Uesio URL navigation, as it ensures that the Host header is set
// while access the correct URL.  This ensures Uesio gets fed the subdomains it needs (e.g. "studio")
// even though the URL we are visiting can be "localhost:3000" or "app:3000" (in docker network)
Cypress.Commands.add("visitRoute", (route: string) => {
	cy.visit(`${baseUrl}${route.startsWith("/") ? route : "/" + route}`, {
		headers: {},
	})
})

declare global {
	namespace Cypress {
		interface Chainable {
			isVisible: () => boolean
		}
	}
}

// Access element whose parent is hidden
Cypress.Commands.add(
	"isVisible",
	{
		prevSubject: true,
	},
	(subject) => {
		const isVisible = (elem: any) =>
			!!(
				elem.offsetWidth ||
				elem.offsetHeight ||
				elem.getClientRects().length
			)
		expect(isVisible(subject[0])).to.be.true
	}
)

declare global {
	namespace Cypress {
		interface Chainable {
			loginWithAppAndWorkspace(
				appName: string,
				workspaceName: string
			): Chainable<void>
			login(): Chainable<void>
			visitRoute(route: string): Chainable<void>
			getByIdFragment(
				elementType: string,
				id: string,
				timeout?: number
			): Chainable<void>
			typeInInput(inputIdFragment: string, value: string): Chainable<void>
			clearInput(inputIdFragment: string): Chainable<void>
			clickButton(idFragment: string): Chainable<void>
			clickButtonIfExists(idFragment: string): Chainable<void>
			getComponentState(componentId: string): Chainable<void>
			hotkey(hotkey: string): Chainable<void>
			changeSelectValue(
				selectElementIdFragment: string,
				value: string
			): Chainable<void>
			//   drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
			//   dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
			//   visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
		}
	}
}
function createWorkspaceInApp(workspaceName: string, appName: string) {
	cy.clickButton("uesio/io.button:add-workspace")
	cy.typeInInput("workspace-name", workspaceName)
	cy.clickButton("uesio/io.button:save-workspace")
	cy.url().should("contain", getWorkspaceBasePath(appName, workspaceName))
}

function createApp(appName: string) {
	cy.clickButton("uesio/studio.home($root):uesio/io.button:add-app")
	cy.typeInInput("new-app-name", appName)
	cy.typeInInput("new-app-description", "E2E Test App")
	cy.clickButton("save-new-app")
	cy.url().should("contain", getAppBasePath(appName))
}

const login = () => {
	cy.visitRoute("login")
	cy.title().should("eq", "Uesio - Login")
	if (useMockLogin) {
		cy.clickButton("uesio/core.loginmock:mock-login-uesio")
	} else {
		cy.typeInInput("username", automationUsername)
		cy.typeInInput("password", automationPassword)
		cy.clickButton("sign-in")
	}
	cy.url().should("contain", "/home")
}
