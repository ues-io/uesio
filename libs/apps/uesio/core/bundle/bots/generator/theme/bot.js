function run(bot) {
  const name = bot.params.get("name")
  const primary = bot.params.get("primary")
  const secondary = bot.params.get("secondary")
  const error = bot.params.get("error")
  const warning = bot.params.get("warning")
  const info = bot.params.get("info")
  const success = bot.params.get("success")

  bot.generateFile(
    "themes/" + name + ".yaml",
    {
      name,
      primary,
      secondary,
      error,
      warning,
      info,
      success,
    },
    "templates/theme.yaml",
  )
}
