function file(bot) {
  var name = bot.params.get("name")
  var files = bot.params.get("files")
  var path = bot.params.get("path")

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
