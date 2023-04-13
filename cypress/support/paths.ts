const baseUrl = Cypress.env("studio_base_url")
const username = Cypress.env("automation_username")

export const getBaseUrl = () => `${baseUrl}`

export const getAppBasePath = (appName: string) => `/app/${username}/${appName}`
export const getWorkspaceBasePath = (appName: string, workspaceName: string) =>
	`${getAppBasePath(appName)}/workspace/${workspaceName}`
