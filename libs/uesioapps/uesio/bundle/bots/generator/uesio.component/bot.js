function collection(bot) {
	var name = bot.params.get("name")
	var namespace = bot.getNamespace()
	bot.generateFile(
		"components/view/" + namespace + "." + name + ".tsx",
		{},
		"component.tsx"
	)
	bot.generateFile(
		"components/view/" + namespace + "." + name + "definition.ts",
		{},
		"componentdefinition.ts"
	)
}
