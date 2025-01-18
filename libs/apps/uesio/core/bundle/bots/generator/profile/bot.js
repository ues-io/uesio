function profile(bot) {
  var name = bot.params.get("name")
  var permissionSets = bot.params.get("permissionSets") || "[]"

  bot.generateYamlFile(
    "profiles/" + name + ".yaml",
    {
      name,
      permissionSets,
      homeRoute: bot.params.get("homeRoute"),
      label: bot.params.get("label"),
    },
    "templates/profile.yaml",
  )
}
