function generate(bot) {
  bot.generateFile(
    "bundle.yaml",
    {
      name: bot.getAppName(),
    },
    "templates/template.bundle.yaml",
  )
}
