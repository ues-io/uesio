function run(bot) {
  const name = bot.params.get("name")
  const files = bot.params.get("files")
  const path = bot.params.get("path")

  files.forEach((file) => {
    bot.generateBase64File("files/" + name + "/" + file.path, file.data)
  })

  bot.generateYamlFile(
    "files/" + name + "/file.yaml",
    {
      name,
      path,
    },
    "templates/file.yaml",
  )
}
