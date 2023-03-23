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
	const salesEmail = bot.getConfigValue("uesio/web.sales_email")
	const templateIdUser = bot.getConfigValue(
		"uesio/web.email_template_leadresponse"
	)
	const templateIdSales = bot.getConfigValue(
		"uesio/web.email_template_lead_added_sales"
	)

	// Email to user
	bot.runIntegrationAction("uesio/web.sendgrid", "sendEmail", {
		to: [values["uesio/crm.email"]],
		from: salesEmail,
		templateId: templateIdUser,
	})

	// Email to us
	bot.runIntegrationAction("uesio/web.sendgrid", "sendEmail", {
		to: [salesEmail],
		from: salesEmail,
		templateId: templateIdSales,
		dynamicTemplateData: {
			firstname: values["uesio/crm.firstname"],
			lastname: values["uesio/crm.lastname"],
			email: values["uesio/crm.email"],
			role: values["uesio/web.role"],
			account: values["uesio/crm.account"],
		},
	})
}
