function route(bot) {
	const params = bot.params.getAll()
	bot.generateFile(
		`routes/${params.name}.yaml`,
		params,
		`templates/route_${params.type || "view"}.template.yaml`
	)
}
