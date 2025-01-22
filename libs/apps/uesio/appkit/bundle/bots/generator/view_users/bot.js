function generate(bot) {
  const namespace = bot.getAppName()
  bot.runGenerator("uesio/core", "view", {
    name: "users",
    definition: bot.mergeYamlTemplate(
      {
        namespace,
      },
      "templates/users.yaml",
    ),
  })
  bot.runGenerator("uesio/core", "view", {
    name: "user",
    definition: bot.mergeYamlTemplate(
      {
        namespace,
      },
      "templates/user.yaml",
    ),
  })
  bot.runGenerator("uesio/core", "view", {
    name: "user_new",
    definition: bot.mergeYamlTemplate(
      {
        namespace,
      },
      "templates/user_new.yaml",
    ),
  })
  bot.runGenerator("uesio/core", "route", {
    name: "users",
    path: "users",
    view: "users",
    theme: "uesio/core.default",
    title: "Users",
  })
  bot.runGenerator("uesio/core", "route", {
    name: "user",
    path: "users/user/{recordid}",
    view: "user",
    theme: "uesio/core.default",
    title: "User",
  })
  bot.runGenerator("uesio/core", "route", {
    name: "user_new",
    path: "users/new",
    view: "user_new",
    theme: "uesio/core.default",
    title: "Create User",
  })
  bot.runGenerator("uesio/core", "route", {
    name: "myprofile",
    path: "myprofile",
    view: "user",
    theme: "uesio/core.default",
    params: "\n  recordid: $User{id}",
    title: "My Profile",
  })
  bot.runGenerator("uesio/core", "routeassignment", {
    type: "list",
    route: "users",
    collection: "uesio/core.user",
  })
  bot.runGenerator("uesio/core", "routeassignment", {
    type: "detail",
    route: "user",
    collection: "uesio/core.user",
  })
  bot.runGenerator("uesio/core", "routeassignment", {
    type: "createnew",
    route: "user_new",
    collection: "uesio/core.user",
  })
}
