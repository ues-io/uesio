function onchange(bot) {
	bot.updates.get().forEach(function (change) {
		var type = change.get("studio.type")
		if (type === "REFERENCE") {
			var referencedCollection = change.get("studio.referencedCollection")
			if (!referencedCollection) {
				bot.addError("Field: Referenced Collection is required")
			}
		}
	})
}
