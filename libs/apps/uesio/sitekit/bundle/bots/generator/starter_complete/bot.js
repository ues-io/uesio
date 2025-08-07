function run(bot) {
  /*
	// We could create a sample blog here.
	const doSampleData = bot.params.get("use_ai_for_sample_data")
	if (doSampleData && doSampleData !== "false") {
		bot.runGenerator("uesio/appkit", "sample_data", {
			instructions: bot.params.get("sample_data_instructions"),
		})
	}
	*/

  // Bundle it all
  const bundle = bot.createBundle({
    description: "Sitekit Starter",
    releaseType: "patch",
  })

  const version = `v${bundle.major}.${bundle.minor}.${bundle.patch}`
  const siteName = "prod"
  const appName = bot.getAppName()
  const subdomain = `${appName.replace(/[\/_]/g, "-")}-${siteName}`

  // Create Site
  bot.createSite({
    siteName,
    subdomain,
    version,
  })
}
