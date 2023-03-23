import { AfterSaveBotApi } from "uesio/bots"
function addlead(bot: AfterSaveBotApi) {
	const fields = [
		"uesio/crm.firstname",
		"uesio/crm.lastname",
		"uesio/crm.email",
		"uesio/crm.account",
	]

	const values = fields.reduce(
		(prev, key) => ({ ...prev, [key]: bot.params.get(key).toLowerCase() }),
		{}
	)

	// // TODO: callbots can't throw errors yet. Uncomment when they can
	// const labels = {
	// 	"uesio/crm.firstname": "first name",
	// 	"uesio/crm.lastname": "last name",
	// 	"uesio/crm.email": "email",
	// 	"uesio/web.role": "role",
	// 	"uesio/crm.account": "company",
	// }
	// for (const key in values) {
	// 	if (!values[key]) bot.addError(`missing ${labels[f]}`)
	// }

	// Save the lead in our leads collection
	bot.save("uesio/crm.lead", [values])

	// Send an email to the user
	const from = bot.getConfigValue("uesio/web.sales_email")
	const templateId = bot.getConfigValue(
		"uesio/web.email_template_leadresponse"
	)
	bot.runIntegrationAction("uesio/web.sendgrid", "sendEmail", {
		subject: "uesio beta access",
		to: [values["uesio/crm.email"]],
		from,
		templateId,
	})
}
