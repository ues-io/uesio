function onchange(bot) {
	bot.changes.get().forEach(function (changeresponse) {
		var name = changeresponse.get("crm.name")
		if (!name) {
			return
		}
		if (name.toLowerCase() === "skuid") {
			throw new Error("No Skuids Allowed!")
		}
		if (name.toLowerCase() === "skuidify") {
			bot.addError("No Skuids Allowed!")
		}
		//changeresponse.set("crm.name", name + " ben is cool!!")
	})
}
