import { ListenerBotApi, Record as WireRecord } from "@uesio/bots"
function addlead(bot: ListenerBotApi) {
	const fields = [
		"uesio/crm.firstname",
		"uesio/crm.lastname",
		"uesio/crm.email",
		"uesio/crm.account",
		"uesio/crm.title",
		"uesio/crm.location",
	]

	const values = fields.reduce(
		(prev, key) => ({
			...prev,
			[key]: ((bot.params.get(key) as string) || "").toLowerCase(),
		}),
		{}
	) as Record<string, string>

	// TODO: callbots can't throw errors yet. Uncomment when they can
	const labels = {
		"uesio/crm.firstname": "first name",
		"uesio/crm.lastname": "last name",
		"uesio/crm.email": "email",
		"uesio/crm.account": "company",
		"uesio/crm.title": "title",
		"uesio/crm.location": "location",
	} as Record<string, string>
	for (const key in values) {
		if (!values[key]) throw new Error(`missing ${labels[key]}`)
	}

	// Save the lead in our leads collection
	bot.asAdmin.save("uesio/crm.lead", [values as unknown as WireRecord])

	// Send an email to the user
	const salesEmail = bot.asAdmin.getConfigValue("uesio/crm.sales_email")
	const templateIdUser = bot.asAdmin.getConfigValue(
		"uesio/crm.email_template_lead_created_client"
	)
	const templateIdSales = bot.asAdmin.getConfigValue(
		"uesio/crm.email_template_lead_created_internal"
	)

	// Email to user
	bot.asAdmin.runIntegrationAction("uesio/crm.sendgrid", "sendEmail", {
		to: [values["uesio/crm.email"]],
		from: salesEmail,
		templateId: templateIdUser,
	})

	// Email to us
	bot.asAdmin.runIntegrationAction("uesio/crm.sendgrid", "sendEmail", {
		to: [salesEmail],
		from: salesEmail,
		templateId: templateIdSales,
		dynamicTemplateData: {
			firstname: values["uesio/crm.firstname"],
			lastname: values["uesio/crm.lastname"],
			email: values["uesio/crm.email"],
			account: values["uesio/crm.account"],
			title: values["uesio/crm.title"],
			location: values["uesio/crm.location"],
		},
	})
}
