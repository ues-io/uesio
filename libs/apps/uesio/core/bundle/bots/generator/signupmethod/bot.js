function run(bot) {
  const name = bot.params.get("name")
  const namespace = bot.getAppName()
  const authSource = bot.params.get("authSource") || ""
  const profile = bot.params.get("profile") || ""
  const usernameTemplate = bot.params.get("usernameTemplate") || ""
  const landingRoute = bot.params.get("landingRoute") || ""
  const createLoginBot = bot.params.get("createLoginBot") || ""
  const signupBot = bot.params.get("signupBot") || ""
  const resetPasswordBot = bot.params.get("resetPasswordBot") || ""
  const usernameRegex = bot.params.get("usernameRegex") || ""
  const usernameFormatExplanation =
    bot.params.get("usernameFormatExplanation") || ""
  const autoLogin = bot.params.get("autoLogin") || ""
  const enableSelfSignup = bot.params.get("enableSelfSignup") || ""

  bot.generateFile(
    `signupmethods/${name}.yaml`,
    {
      name,
      authSource,
      profile,
      usernameTemplate,
      landingRoute,
      createLoginBot,
      signupBot,
      resetPasswordBot,
      usernameRegex,
      usernameFormatExplanation,
      autoLogin,
      enableSelfSignup,
    },
    "templates/signupmethod.yaml",
  )

  bot.setRedirect(`/signupmethods/${namespace}/${name}`)
}
