function view_home(bot) {
  const namespace = bot.getAppName()
  var definition = bot.mergeYamlTemplate(
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
