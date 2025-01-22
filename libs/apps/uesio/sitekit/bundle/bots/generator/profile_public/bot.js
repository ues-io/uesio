function run(bot) {
  const namespace = bot.getAppName()
  bot.runGenerator("uesio/core", "permissionset", {
    name: "public",
    routes: {
      [`${namespace}.home`]: true,
    },
    views: {
      [`${namespace}.home`]: true,
      [`${namespace}.header`]: true,
      [`${namespace}.footer`]: true,
    },
    allowAllFiles: true,
  })

  bot.runGenerator("uesio/core", "profile", {
    name: "public",
    permissionSets: [namespace + ".public", "uesio/core.public"],
  })
}
