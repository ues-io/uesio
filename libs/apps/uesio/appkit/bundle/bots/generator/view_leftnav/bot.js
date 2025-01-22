function run(bot) {
  const app = bot.getApp()
  const definition = bot.mergeYamlTemplate(
    {
      icon: app.getIcon(),
      iconcolor: '"' + app.getColor() + '"',
      appname: app.getName(),
    },
    "templates/leftnav.yaml",
  )

  bot.runGenerator("uesio/core", "view", {
    name: "leftnav",
    definition,
  })
}
