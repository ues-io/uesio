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

const baseUrl = Cypress.config().baseUrl
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
    login()
    createApp(appName)
    createWorkspaceInApp(workspaceName, appName)
  },
)

// Logs in to the app and creates 2 workspaces
// and creates an App and Workspace to use for subsequent tests
Cypress.Commands.add(
  "loginWithAppAnd2Workspaces",
  (appName: string, workspace1Name: string, workspace2Name: string) => {
    login()
    createApp(appName)
    createWorkspaceInApp(workspace1Name, appName)
    cy.visitRoute(getAppBasePath(appName))
    createWorkspaceInApp(workspace2Name, appName)
  },
)

// Just logs in to the app
Cypress.Commands.add("login", () => {
  cy.session("automationSession2", login)
})

// Gets an element of a given type whose id contains a given string
Cypress.Commands.add(
  "getByIdFragment",
  (elementType: string, idFragment: string, timeout?: number) =>
    cy.get(idContainsSelector(elementType, idFragment), {
      timeout: timeout || 1000,
    }),
)

Cypress.Commands.add(
  "setReferenceField",
  (idFragment: string, value: string) => {
    cy.get(idContainsSelector("div", idFragment)).click()
    cy.focused().type(value)
    cy.get(`[id^="floatingMenu"][id*="${idFragment}"] + div div[role="option"]`)
      .first()
      .click()
  },
)

// Gets an input element whose id contains a given string, and types a string into it
Cypress.Commands.add("typeInInput", (idFragment: string, value: string) => {
  cy.get(idContainsSelector("input", idFragment)).type(value)
})

Cypress.Commands.add("typeInTextArea", (idFragment: string, value: string) => {
  cy.get(idContainsSelector("textarea", idFragment)).type(value)
})

// Clears an input element whose id contains a given string
Cypress.Commands.add("clearInput", (idFragment: string) => {
  cy.get(idContainsSelector("input", idFragment)).clear()
})

// Clears an input element whose id contains a given string
Cypress.Commands.add("getInput", (idFragment: string) => {
  cy.get(idContainsSelector("input", idFragment))
})

// Changes the value of a <select>
Cypress.Commands.add(
  "changeSelectValue",
  (selectElementIdFragment: string, value: string) => {
    cy.get(idContainsSelector("select", selectElementIdFragment)).select(value)
  },
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

Cypress.Commands.add(
  "hasExpectedTableField",
  (
    tableIdFragment: string,
    rowNumber: number,
    expectName: string,
    expectNamespace: string,
    expectType: string,
    expectLabel: string,
  ) => {
    const tableRowSelector = `table[id$="${tableIdFragment}"]>tbody>tr`
    cy.get(tableRowSelector)
      .eq(rowNumber)
      .children("td")
      .eq(0)
      .children("div")
      .first()
      .children("div")
      .first()
      .should(($div) => {
        // should have found 1 element
        expect($div).to.have.length(1)
        expect($div.children("p").eq(0)).to.contain(expectName)
        expect($div.children("p").eq(1)).to.contain(expectNamespace)
      })
    cy.get(tableRowSelector)
      .eq(rowNumber)
      .children("td")
      .eq(1)
      .find("div.readonly-input")
      .first()
      .should("have.text", expectType)
    cy.get(tableRowSelector)
      .eq(rowNumber)
      .children("td")
      .eq(2)
      .find("div.readonly-input")
      .first()
      .should("have.text", expectLabel)
  },
)

// Checks a component state
Cypress.Commands.add("getComponentState", (componentId: string) => {
  cy.window().its("uesio.api.component").invoke("getExternalState", componentId)
})

Cypress.Commands.add("getRoute", () => {
  cy.window().its("uesio.api.route").invoke("getRoute")
})

Cypress.Commands.add("getWireState", (viewId: string, wireName: string) => {
  cy.window().its("uesio.api.wire").invoke("getWire", viewId, wireName)
})

// Enters a global hotkey
Cypress.Commands.add("hotkey", (hotkey: string) => {
  cy.get("body").type(hotkey)
})

// Use this for all Uesio URL navigation, as it ensures that the Host header is set
// while access the correct URL.  This ensures Uesio gets fed the subdomains it needs (e.g. "studio")
// even though the URL we are visiting can be "localhost:3000" or "app:3000" (in docker network)
Cypress.Commands.add("visitRoute", (route: string) => {
  const targetUrl = `${baseUrl}${route.startsWith("/") ? route : "/" + route}`
  cy.visit(targetUrl, {
    headers: {},
  })
  cy.url().should("include", route)
})

function createWorkspaceInApp(workspaceName: string, appName: string) {
  cy.clickButton("uesio/io.button:add-workspace")
  cy.typeInInput("workspace-name", workspaceName)
  cy.clickButton("uesio/io.button:save-new-workspace")
  // TODO: There was originally an assertion here:
  // cy.url().should(
  // 	"eq",
  // 	Cypress.config().baseUrl + getWorkspaceBasePath(appName, workspaceName)
  // )
  // That was commented out with a comment that the assertion was "incredibly flaky" although not sure why
  // nor any details on what was flaky. In its place was the assertion:
  // cy.url().should("include", `workspace/${workspaceName}`)
  // which does not appear to really be any different from an assertion perspective other than the base url
  // part.  Unfortunately, there isn't much to go on in terms of what errors/issues existed and I'm unable to
  // reproduce an issue with the original assertion currently.  The only possible reasons I can think of are:
  //     1. the baseUrl property in the config ended with a / in which case the string concat could have a // and fail eq test
  //     2. creating the workspace took longer than the default 4 second timeout
  //     3. there were name conflicts in the workspace name
  // Since I'm unable to reproduce this currently, putting back the original assertion minus the baseUrl since
  // it's not really needed. If the problem is the 4 second issue, then a longer timeout can be
  // specified, see https://docs.cypress.io/api/commands/location#Arguments.  If the problem is something else,
  // it should be investigated and resolved or at least provide further details here so eventually it can be fixed.
  cy.location("pathname").should(
    "eq",
    getWorkspaceBasePath(appName, workspaceName),
  )
}

function createApp(appName: string) {
  cy.clickButton("uesio/io.button:add-app")
  cy.typeInInput("new-app-name", appName)
  cy.typeInTextArea("new-app-description", "E2E Test App")
  cy.clickButton("save-new-app")
  // TODO: There was originally an assertion here:
  // cy.url().should("eq", Cypress.config().baseUrl + getAppBasePath(appName))
  // That was commented out with a comment that the assertion was "incredibly flaky" although not sure why
  // nor any details on what was flaky. In its place was the assertion:
  // cy.url().should("include", getAppBasePath(""))
  // which does not appear to really be any different from an assertion perspective other than the base url
  // part.  Unfortunately, there isn't much to go on in terms of what errors/issues existed and I'm unable to
  // reproduce an issue with the original assertion currently.  The only possible reasons I can think of are:
  //     1. the baseUrl property in the config ended with a / in which case the string concat could have a // and fail eq test
  //     2. creating the app took longer than the default 4 second timeout
  //     3. there were name conflicts in the app name
  //     4. there is an issue with the password generator that would cause user creation to fail - see https://github.com/ues-io/uesio/issues/4768
  // Since I'm unable to reproduce this currently (other than the password generation issue), putting back the original assertion 
  // minus the baseUrl since it's not really needed. If the problem is the 4 second issue, then a longer timeout can be
  // specified, see https://docs.cypress.io/api/commands/location#Arguments.  If the problem is something else,
  // it should be investigated and resolved or at least provide further details here so eventually it can be fixed.
  cy.location("pathname").should("eq", getAppBasePath(appName))
}

const login = () => {
  cy.visitRoute("login")
  cy.title().should("eq", "Uesio - Login")
  if (useMockLogin) {
    cy.clickButton("mock-login-uesio")
  } else {
    cy.typeInInput("username", automationUsername)
    cy.typeInInput("password", automationPassword)
    cy.clickButton("sign-in")
  }
  cy.url().should("contain", "/home")
}
