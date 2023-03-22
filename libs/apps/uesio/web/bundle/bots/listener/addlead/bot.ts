import { AfterSaveBotApi } from "uesio/bots"
function addlead(bot: AfterSaveBotApi) {
	const fields = ["firstname", "lastname", "email", "role"]

	const values = fields.reduce(
		(prev, key) => ({ ...prev, [key]: bot.params.get(key) }),
		{}
	)

	// TODO: callbots can't throw errors yet. Uncomment when they can
	// const labels = {
	// 	firstname: "first name",
	// 	lastname: "last name",
	// 	email: "email",
	// 	role: "role",
	// }
	// for (const f of values) {
	// 	if (!values[f]) bot.addError(`missing ${labels[f]}`)
	// }

	// Save the lead in our leads collection
	const savedata = fields.reduce(
		(prev, key) => ({
			...prev,
			[`uesio/${key === "role" ? "web" : "crm"}.${key}`]:
				bot.params.get(key),
		}),
		{}
	)
	bot.save("uesio/crm.lead", [savedata])

	// Send an email to the user
	const from = bot.getConfigValue("uesio/web.sales_email")
	const templateId = bot.getConfigValue(
		"uesio/web.email_template_leadresponse"
	)
	bot.runIntegrationAction("uesio/web.sendgrid", "sendEmail", {
		subject: "uesio beta access",
		to: [values.email],
		from,
		templateId,
	})
}
