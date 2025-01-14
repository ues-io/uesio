function init(bot) {
	var name = bot.params.get("name")
	var params = {
		name,
		pkgName: `${name?.includes("/") ? "@" : ""}${name}`,
	}
	var templatePrefix = "templates/template."
	bot.generateFile(".gitignore", params, `${templatePrefix}gitignore`)
	bot.generateFile("tsconfig.json", {}, `${templatePrefix}tsconfig.json`)
	bot.generateFile(".eslintrc.json", {}, `${templatePrefix}eslintrc.json`)
	bot.generateFile(".prettierrc.yaml", {}, `${templatePrefix}prettierrc.yaml`)
	bot.generateFile(".prettierignore", {}, `${templatePrefix}prettierignore`)
	bot.generateFile("package.json", params, `${templatePrefix}package.json`)
	bot.generateFile(
		"bundle/bundle.yaml",
		params,
		"templates/template.bundle.yaml"
	)
}
