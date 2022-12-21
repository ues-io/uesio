function collection(bot) {
	var name = bot.params.get("name")
	var baseDir = "components/view/" + name + "/"
	bot.generateFile(baseDir + name + ".tsx", {}, "templates/component.tsx")
}
