function collection(bot) {
	var name = bot.params.get("name")
	var namespace = bot.getNamespace()
	var baseDir = "components/view/" + namespace + "." + name + "/"
	bot.generateFile(baseDir + name + ".tsx", {}, "component.tsx")
}
