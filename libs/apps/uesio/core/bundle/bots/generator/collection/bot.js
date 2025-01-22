function run(bot) {
  const name = bot.params.get("name")
  const label = bot.params.get("label")
  const pluralLabel = bot.params.get("pluralLabel")
  const nameField = bot.params.get("nameField")
  const icon = bot.params.get("icon")
  bot.generateFile(
    "collections/" + name + ".yaml",
    {
      name,
      label,
      pluralLabel,
      nameField,
      icon,
    },
    "templates/collection.yaml",
  )
}
