function addcontact(bot) {
	bot.results.get().forEach(function (result) {
		if (result.isNew()) {
			var accountId = result.get("crm.id")
			bot.save("crm.contacts",[
				{
					"crm.firstname": "George",
					"crm.lastname": "Washington",
					"crm.accountid": accountId,
				}
			])
		}
	})
}
