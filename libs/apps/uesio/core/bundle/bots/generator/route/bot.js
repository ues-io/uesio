function run(bot) {
  const name = bot.params.get("name")
  const namespace = bot.getAppName()
  const params = bot.params.getAll()

  if (!params.params) {
    params.params = ""
  }
  bot.generateFile(
    `routes/${params.name}.yaml`,
    params,
    `templates/route_${params.type || "view"}.template.yaml`,
  )

  bot.setRedirect(`/routes/${namespace}/${name}`)
}
