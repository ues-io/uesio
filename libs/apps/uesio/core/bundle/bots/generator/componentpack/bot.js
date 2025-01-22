function run(bot) {
  const name = bot.params.get("name")
  bot.generateYamlFile(
    `componentpacks/${name}/pack.yaml`,
    {
      name,
    },
    "templates/pack.yaml",
  )
}
