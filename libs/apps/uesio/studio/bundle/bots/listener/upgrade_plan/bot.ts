import { ListenerBotApi } from "@uesio/bots"
import { wire } from "@uesio/ui"

interface SearchResult<T> {
	data: T[]
}

interface Customer {
	id: string
	email?: string
	metadata?: Record<string, string>
	name?: string
}

export default function upgrade_plan(bot: ListenerBotApi) {
	const params = bot.params.getAll()
	const { plan } = params
	const user = bot.getUser()
	const integration = "uesio/stripe.stripe"
	const searchResult = bot.runIntegrationAction(
		integration,
		"customer_search",
		{
			metadata: `metadata['uesio/core.uniquekey']:'${user.getUniqueKey()}'`,
		}
	) as Record<string, SearchResult<Customer>>

	let customer =
		searchResult["customer"]["data"].length > 0
			? searchResult["customer"]["data"][0]
			: null

	if (!customer) {
		const email = user.getEmail()
		if (email == "") {
			throw new Error("Email is required to in order to change a plan")
		}
		const createResult = bot.runIntegrationAction(
			integration,
			"customer_create",
			{
				name: user.getUsername(),
				email,
				metadata: { "uesio/core.uniquekey": user.getUniqueKey() },
			}
		) as Record<string, Customer>
		customer = createResult["customer"]
	}

	const checkoutResult = bot.runIntegrationAction(integration, "checkout", {
		mode: "subscription",
		currency: "usd",
		customer: customer.id,
		success_url:
			"https://studio.uesio-dev.com:3000/paymentsuccess/{CHECKOUT_SESSION_ID}",
		cancel_url: "https://studio.uesio-dev.com:3000/user/usage",
		line_items: [
			{
				price: plan,
				quantity: 1,
			},
		],
	}) as wire.FieldValue

	bot.addResult("checkoutResult", checkoutResult)
}
