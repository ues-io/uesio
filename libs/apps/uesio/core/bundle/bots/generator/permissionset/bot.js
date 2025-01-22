function generate(bot) {
  const name = bot.params.get("name")
  const namedPermissions = bot.params.get("namedPermissions") || "{}"

  const views = bot.params.get("views") || "{}"
  const collections = bot.params.get("collections") || "{}"
  const routes = bot.params.get("routes") || "{}"
  const files = bot.params.get("files") || "{}"
  const bots = bot.params.get("bots") || "{}"
  const integrationActions = bot.params.get("integrationActions") || "{}"

  const allowAllBots = bot.params.get("allowAllBots") || false
  const allowAllCollections = bot.params.get("allowAllCollections") || false
  const allowAllViews = bot.params.get("allowAllViews") || false
  const allowAllRoutes = bot.params.get("allowAllRoutes") || false
  const allowAllFiles = bot.params.get("allowAllFiles") || false
  const allowAllIntegrationActions =
    bot.params.get("allowAllIntegrationActions") || false

  const modifyAllRecords = bot.params.get("modifyAllRecords") || false
  const viewAllRecords = bot.params.get("viewAllRecords") || false

  bot.generateYamlFile(
    "permissionsets/" + name + ".yaml",
    {
      name,
      namedPermissions,
      views,
      collections,
      routes,
      files,
      bots,
      integrationActions,
      allowAllBots,
      allowAllCollections,
      allowAllViews,
      allowAllRoutes,
      allowAllFiles,
      allowAllIntegrationActions,
      modifyAllRecords,
      viewAllRecords,
    },
    "templates/permissionset.yaml",
  )
}
