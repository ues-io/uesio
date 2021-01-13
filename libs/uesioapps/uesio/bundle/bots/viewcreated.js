function onchange(bot) {
	bot.changes.get().forEach(function (change) {
		var defintion = change.get("uesio.definition")
		if ((change.isNew() && !defintion) || defintion === "") {
			change.set(
				"uesio.definition",
				"# Wires connect to data in collections\nwires:\n# Components determine the layout and composition of your view\ncomponents:"
			)
		}
	})
}
