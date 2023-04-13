import { AfterSaveBotApi } from "uesio/bots"

function addlead(bot: AfterSaveBotApi) {
	// bot.inserts.get().forEach(function (change) {
	// 	const fromEmail = bot.getConfigValue("uesio/crm.from_email")
	// 	const salesEmail = bot.getConfigValue("uesio/crm.sales_email")
	// 	bot.runIntegrationAction("uesio/crm.sendgrid", "sendEmail", {
	// 		subject: "New Lead Created",
	// 		to: [salesEmail],
	// 		from: fromEmail,
	// 		plainBody:
	// 			change.get("uesio/crm.firstname") +
	// 			" " +
	// 			change.get("uesio/crm.lastname"),
	// 	})
	// })
}
