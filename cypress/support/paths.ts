const baseUrl = Cypress.config().baseUrl
const username = Cypress.env("automation_username")

export const getBaseUrl = () => `${baseUrl}`

export const getAppNamespace = (appName: string) => `${username}/${appName}`
export const getAppBasePath = (appName: string) =>
  `/app/${getAppNamespace(appName)}`
export const getWorkspaceBasePath = (appName: string, workspaceName: string) =>
  `${getAppBasePath(appName)}/workspace/${workspaceName}`
export const getWorkspaceRoutePreviewPath = (
  appName: string,
  workspaceName: string,
  username: string,
  routePath: string,
) =>
  `/workspace/${username}/${appName}/${workspaceName}/app/${username}/${appName}/${routePath}`
