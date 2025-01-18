export const getViewID = (
  username: string,
  appName: string,
  viewName: string,
) => `${username}/${appName}.${viewName}($root)`
