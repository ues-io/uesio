function variant_viewlayout_default(bot) {
  var namespace = bot.getAppName()
  var definition = bot.mergeYamlTemplate(
    {
      namespace,
    },
    "templates/default.yaml",
  )
  bot.runGenerator("uesio/core", "componentvariant", {
    name: "default",
    component: "uesio/io.viewlayout",
    extends: "uesio/appkit.default",
    label: "Default Layout Variant",
    definition,
  })
}
