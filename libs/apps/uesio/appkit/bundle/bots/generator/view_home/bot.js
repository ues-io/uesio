function generate(bot) {
  const namespace = bot.getAppName()
  const definition = bot.mergeYamlTemplate(
    {
      namespace,
    },
    "templates/home.yaml",
  )
  bot.runGenerator("uesio/core", "view", {
    name: "home",
    definition,
  })
  bot.runGenerator("uesio/core", "route", {
    name: "home",
    path: "home",
    view: "home",
    theme: "uesio/core.default",
    title: "Home",
  })
}
