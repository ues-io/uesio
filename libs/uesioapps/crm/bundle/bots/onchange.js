function onchange(bot) {
	bot.changerequests.get().forEach(function (changerequest) {
		var name = changerequest.get("crm.name")
		if (!name) {
			return
		}
		if (name.toLowerCase() === "skuid") {
			throw new Error("No Skuids Allowed!")
		}
		if (name.toLowerCase() === "skuidify") {
			bot.addError("No Skuids Allowed!")
		}
		changerequest.set("crm.name", name + " ben is cool!!")
	})
}
