function onchange(bot) {
	bot.inserts.get().forEach(function (insert) {
		if (!insert.get("studio.definition")) {
			insert.set(
				"studio.definition",
				"# Wires connect to data in collections\nwires: {}\n# Components determine the layout and composition of your view\ncomponents: []"
			)
		}
	})
}
