function onchange(bot) {
	bot.inserts.get().forEach(function (change) {
		var name = change.get("crm.name")
		if (!name) {
			return
		}
		if (name.toLowerCase() === "skuid") {
			throw new Error("No Skuids Allowed!")
		}
		if (name.toLowerCase() === "skuidify") {
			bot.addError("No Skuids Allowed!")
		}
		change.set("crm.name", name + " ben is cool!!")
	})
	bot.updates.get().forEach(function (change) {
		var name = change.get("crm.name")
		if (!name) {
			return
		}
		if (name.toLowerCase() === "skuid") {
			throw new Error("No Skuids Allowed!")
		}
		if (name.toLowerCase() === "skuidify") {
			bot.addError("No Skuids Allowed!")
		}
		change.set("crm.no_of_employees", 4)
		change.set("crm.name", name + " ben is cool!!")
	})
}
