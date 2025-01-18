function view_leftnav(bot) {
  var app = bot.getApp()
  var definition = bot.mergeYamlTemplate(
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
