function onchange(bot) {
	function check(change) {
		var type = change.get("studio.type")
		if (!type) {
			bot.addError("Field: Type is required")
		}
		if (type === "REFERENCE") {
			var referencedCollection = change.get("studio.referencedCollection")
			if (!referencedCollection) {
				bot.addError("Field: Referenced Collection is required")
			}
		}
	}
	bot.updates.get().forEach(check)
	bot.inserts.get().forEach(check)
}
