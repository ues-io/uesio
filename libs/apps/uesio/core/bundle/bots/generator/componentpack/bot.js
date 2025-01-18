function collection(bot) {
  var name = bot.params.get("name")
  bot.generateYamlFile(
    `componentpacks/${name}/pack.yaml`,
    {
      name,
    },
    "templates/pack.yaml",
  )
}
