function starter_bundledef(bot) {
	bot.generateFile(
		"bundle.yaml",
		{
			name: bot.getAppName(),
		},
		"templates/template.bundle.yaml"
	)
}
