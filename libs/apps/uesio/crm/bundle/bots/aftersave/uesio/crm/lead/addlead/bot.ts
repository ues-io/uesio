import { AfterSaveBotApi } from "uesio/bots"

function addlead(bot: AfterSaveBotApi) {
	bot.inserts.get().forEach(function (change) {
		bot.sendMessage(
			"uesio/crm.sendgrid",
			"New Lead Created",
			change.get("uesio/crm.firstname") +
				" " +
				change.get("uesio/crm.lastname"),
			"plusplusben@gmail.com",
			"plusplusben@gmail.com"
		)
	})
}
