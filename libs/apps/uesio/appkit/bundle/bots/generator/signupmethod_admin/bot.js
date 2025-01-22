function run(bot) {
  const namespace = bot.getAppName()

  bot.runGenerator("uesio/core", "bot", {
    name: "create_login_admin",
    type: "LISTENER",
    dialect: "TYPESCRIPT",
    content: bot.getTemplate("templates/create_login_admin.template.ts"),
    params: [],
  })

  bot.runGenerator("uesio/core", "bot", {
    name: "reset_password_admin",
    type: "LISTENER",
    dialect: "TYPESCRIPT",
    content: bot.getTemplate("templates/reset_password_admin.template.ts"),
    params: [],
  })

  bot.runGenerator("uesio/core", "signupmethod", {
    name: "admin",
    authSource: "uesio/core.platform",
    profile: namespace + ".admin",
    usernameTemplate: "${username}",
    autoLogin: false,
    enableSelfSignup: false,
    createLoginBot: namespace + ".create_login_admin",
    resetPasswordBot: namespace + ".reset_password_admin",
  })
}
