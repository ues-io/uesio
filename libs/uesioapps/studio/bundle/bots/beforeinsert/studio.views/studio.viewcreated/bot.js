function onchange(bot) {
	bot.inserts.get().forEach(function (insert) {
		var defintion = insert.get("studio.definition")
		if ((insert.isNew() && !defintion) || defintion === "") {
			insert.set(
				"studio.definition",
				"# Wires connect to data in collections\nwires: {}\n# Components determine the layout and composition of your view\ncomponents: []"
			)
		}
	})
}
