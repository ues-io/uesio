function run(bot) {
  const name = bot.params.get("name")
  const namespace = bot.getAppName()
  bot.generateYamlFile(
    `componentpacks/${name}/pack.yaml`,
    {
      name,
    },
    "templates/pack.yaml",
  )

  bot.setRedirect(`/componentpacks/${namespace}/${name}`)
}
