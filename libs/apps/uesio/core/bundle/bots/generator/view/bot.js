function run(bot) {
  const name = bot.params.get("name")
  const definition =
    bot.params.get("definition") ||
    bot.getTemplate("templates/blankdefinition.yaml")

  bot.generateYamlFile(
    "views/" + name + ".yaml",
    {
      name,
      definition,
    },
    "templates/view.yaml",
  )
}
