function view_header(bot) {
  const namespace = bot.getAppName()
  const pages = bot.params.get("pages")
  const logoFile = bot.params.get("logoFile")
  const logoFilePath = bot.params.get("logoFilePath")

  // Find the first "CALL_TO_ACTION" page and remove it.
  const infoPages = pages.filter((page) => page.type !== "CALL_TO_ACTION")
  const actionPages = pages.filter((page) => page.type === "CALL_TO_ACTION")

  const infoButtonYaml = infoPages
    .map((page) =>
      bot.mergeYamlTemplate(
        {
          name: page.name,
          variant: "uesio/sitekit.secondary_dark",
        },
        "templates/button.yaml",
      ),
    )
    .join("")

  const actionButtonYaml = actionPages
    .map((page) =>
      bot.mergeYamlTemplate(
        {
          name: page.name,
          variant: "uesio/sitekit.primary_dark",
        },
        "templates/button.yaml",
      ),
    )
    .join("")

  var definition = bot.mergeYamlTemplate(
    {
      namespace,
      infoButtonYaml,
      actionButtonYaml,
      logoFile,
      logoFilePath,
    },
    "templates/header.yaml",
  )
  bot.runGenerator("uesio/core", "view", {
    name: "header",
    definition,
  })
}
