function onchange(bot) {
	bot.changes.get().forEach(function (change) {
		var name = change.get("crm.name")
		if (name.toLowerCase() === "skuid") {
			throw new Error("No Skuids Allowed!")
		}
		if (name.toLowerCase() === "skuidify") {
			bot.addError("No Skuids Allowed!")
		}
		change.set("crm.name", name + " ben is cool!!")
	})
}
