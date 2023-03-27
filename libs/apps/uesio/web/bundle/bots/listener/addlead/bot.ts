import { ListenerBotApi } from "uesio/bots"
function addlead(bot: ListenerBotApi) {
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

	// TODO: callbots can't throw errors yet. Uncomment when they can
	const labels = {
		"uesio/crm.firstname": "first name",
		"uesio/crm.lastname": "last name",
		"uesio/crm.email": "email",
		"uesio/web.role": "role",
		"uesio/crm.account": "company",
	}
	for (const key in values) {
		if (!values[key]) throw new Error(`missing ${labels[key]}`)
	}

	// Save the lead in our leads collection
	bot.save("uesio/crm.lead", [values])

	// Send an email to the user
	const salesEmail = bot.getConfigValue("uesio/crm.sales_email")
	const templateIdUser = bot.getConfigValue(
		"uesio/crm.email_template_lead_created_client"
	)
	const templateIdSales = bot.getConfigValue(
		"uesio/crm.email_template_lead_created_internal"
	)

	// Email to user
	bot.runIntegrationAction("uesio/crm.sendgrid", "sendEmail", {
		to: [values["uesio/crm.email"]],
		from: salesEmail,
		templateId: templateIdUser,
	})

	// Email to us
	bot.runIntegrationAction("uesio/crm.sendgrid", "sendEmail", {
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
