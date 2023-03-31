import { getAppBasePath } from "./paths"

export function getUniqueAppName() {
	return `e2e_${Math.round(Math.random() * 1000)}_${new Date().getTime()}`
}

export function deleteApp(appName: string) {
	cy.visitRoute(getAppBasePath(appName))
	cy.clickButtonIfExists("delete-app")
	cy.clickButtonIfExists("confirm-delete-app")
}
