import { getAppBasePath } from "./paths"

let atomic = 0

export function getUniqueAppName() {
	return `e2e${Math.round(Math.random() * 1000)}${atomic++}`
}

export function deleteApp(appName: string) {
	cy.visitRoute(`${getAppBasePath(appName)}/settings`)
	cy.clickButtonIfExists("delete-app")
	cy.clickButtonIfExists("confirm-delete-app")
}
