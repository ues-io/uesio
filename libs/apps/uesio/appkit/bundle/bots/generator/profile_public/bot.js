function profile_public(bot) {
  const namespace = bot.getAppName()
  bot.runGenerator("uesio/core", "permissionset", {
    name: "public",
    routes: {
      [`${namespace}.login`]: true,
    },
  })

  bot.runGenerator("uesio/core", "profile", {
    name: "public",
    permissionSets: [
      namespace + ".public",
      "uesio/appkit.public",
      "uesio/core.public",
    ],
    label: "Public Profile",
  })
}
