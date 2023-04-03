function onchange(bot) {
	bot.inserts.get().forEach(function (change) {
		var name = change.get("uesio/crm.name")
		if (!name) {
			return
		}
		if (name.toLowerCase() === "skuid") {
			throw new Error("No Skuids Allowed!")
		}
		if (name.toLowerCase() === "skuidify") {
			bot.addError("No Skuids Allowed!")
		}
		change.set("uesio/crm.name", name + " ben is cool!!")
	})
	bot.updates.get().forEach(function (change) {
		var name = change.get("uesio/crm.name")
		if (!name) {
			return
		}
		if (name.toLowerCase() === "skuid") {
			throw new Error("No Skuids Allowed!")
		}
		if (name.toLowerCase() === "skuidify") {
			bot.addError("No Skuids Allowed!")
		}
		change.set("uesio/crm.no_of_employees", 4)
		change.set("uesio/crm.name", name + " ben is cool!!")
	})
}
