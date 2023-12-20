function routeassignment(bot) {
	var type = bot.params.get("type")
	var route = bot.params.get("route")
	var collection = bot.params.get("collection")
	const collectionParts = collection.split(".")
	const collectionNamespace = collectionParts[0]
	const collectionName = collectionParts[1]

	bot.generateFile(
		`routeassignments/${collectionNamespace}/${collectionName}/${type}.yaml`,
		{
			type: type,
			route: route,
		},
		"templates/routeassignment.yaml"
	)
}
