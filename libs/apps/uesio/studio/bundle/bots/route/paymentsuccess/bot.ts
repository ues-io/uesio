import { RouteBotApi, WireRecord } from "@uesio/bots"

interface Session {
	payment_status: "no_payment_required" | "paid" | "unpaid"
	customer: string
	subscription: string
}

interface Subscription {
	plan: { id: string }
}

export default function paymentsuccess(bot: RouteBotApi) {
	const params = bot.params.getAll()
	const { session_id } = params
	const integration = "uesio/stripe.stripe"

	const sessionResult = bot.runIntegrationAction(
		integration,
		"checkout_retrieve",
		{
			id: session_id,
		}
	) as Record<string, Session>

	const session = sessionResult["session"]
	if (session.payment_status == "paid") {
		const subscriptionResult = bot.runIntegrationAction(
			integration,
			"subscription_retrieve",
			{
				id: session.subscription,
			}
		) as Record<string, Subscription>

		const subscription = subscriptionResult["subscription"]
		//get the related plan from uesio based on the stripe key
		const loadresult = bot.load({
			collection: "uesio/studio.usage_plan",
			conditions: [
				{
					field: "uesio/studio.external_plan_id",
					value: subscription.plan.id,
					operator: "EQ",
				},
			],
		})

		const planId = loadresult[0]["uesio/core.id"]
		//get the ID and then delete the current user plan
		const user = bot.getUser()
		const loadUsagePlanUser = bot.load({
			collection: "uesio/studio.usage_plan_user",
			conditions: [
				{
					field: "uesio/core.uniquekey",
					value: user.getUniqueKey(),
					operator: "EQ",
				},
			],
		})

		//delete just if we have some record already
		if (loadUsagePlanUser.length > 0) {
			const usagePlanUserId = loadUsagePlanUser[0]["uesio/core.id"]
			bot.delete("uesio/studio.usage_plan_user", [
				{
					"uesio/core.id": usagePlanUserId,
				},
			] as unknown as WireRecord[])
		}

		//save the new plan
		bot.save("uesio/studio.usage_plan_user", [
			{
				"uesio/studio.user": {
					"uesio/core.id": user.getId(),
				},
				"uesio/studio.plan": {
					"uesio/core.id": planId,
				},
			},
		] as unknown as WireRecord[])
	}

	bot.response.redirectToURL("https://studio.uesio-dev.com:3000/user/usage")
}
