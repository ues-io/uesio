function run(bot) {
  const doSampleData = bot.params.get("use_ai_for_sample_data")
  if (doSampleData && doSampleData !== "false") {
    bot.runGenerator("uesio/appkit", "sample_data", {
      instructions: bot.params.get("sample_data_instructions"),
    })
  }

  // Bundle it all
  const bundle = bot.createBundle({
    description: "Appkit Starter",
    releaseType: "patch",
  })

  const version = `v${bundle.major}.${bundle.minor}.${bundle.patch}`
  const siteName = "prod"
  const appName = bot.getAppName()
  const subdomain = `${appName.replaceAll("/", "-")}-${siteName}`

  // Create Site and domain
  const site = bot.createSite({
    siteName,
    subdomain,
    version,
  })

  const tempPassword = bot.generatePassword()

  const adminUser = bot.getUser()

  bot.createUser({
    siteId: site.id,
    firstName: adminUser.getFirstName(),
    lastName: adminUser.getLastName(),
    username: adminUser.getUsername(),
    email: adminUser.getEmail(),
    profile: appName + ".admin",
    signupMethod: appName + ".admin",
    password: tempPassword,
    setTemporary: true,
  })
}
