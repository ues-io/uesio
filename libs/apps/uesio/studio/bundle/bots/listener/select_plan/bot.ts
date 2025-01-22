import { ListenerBotApi, WireRecord } from "@uesio/bots"
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

interface SubscriptionItem {
  id: string
}

interface Subscription {
  id: string
  items: {
    data: SubscriptionItem[]
  }
}

export default function select_plan(bot: ListenerBotApi) {
  const params = bot.params.getAll()
  const { plan } = params
  const user = bot.getUser()
  const domain = bot.getSession().getSite().getDomain()
  const subdomain = bot.getSession().getSite().getSubDomain()
  const host = `https://${subdomain}.${domain}`
  const STRIPE_INTEGRATION = "uesio/stripe.stripe"
  const searchResult = bot.runIntegrationAction(
    STRIPE_INTEGRATION,
    "customer_search",
    {
      metadata: `metadata['uesio/core.uniquekey']:'${user.getUniqueKey()}'`,
    },
  ) as Record<string, SearchResult<Customer>>

  let customer =
    searchResult.customer.data.length > 0 ? searchResult.customer.data[0] : null

  if (!customer) {
    const email = user.getEmail()
    if (email === "") {
      throw new Error("Email is required to in order to change a plan")
    }
    const createResult = bot.runIntegrationAction(
      STRIPE_INTEGRATION,
      "customer_create",
      {
        name: user.getUsername(),
        email,
        metadata: { "uesio/core.uniquekey": user.getUniqueKey() },
      },
    ) as Record<string, Customer>
    customer = createResult.customer
  }

  const subscriptionResult = bot.runIntegrationAction(
    STRIPE_INTEGRATION,
    "subscription_list",
    {
      customer: customer.id,
    },
  ) as Record<string, SearchResult<Subscription>>

  const subscription =
    subscriptionResult.subscriptions.data.length > 0
      ? subscriptionResult.subscriptions.data[0]
      : null

  if (!subscription) {
    const checkoutResult = bot.runIntegrationAction(
      STRIPE_INTEGRATION,
      "checkout",
      {
        mode: "subscription",
        currency: "usd",
        customer: customer.id,
        success_url: host + "/paymentsuccess/{CHECKOUT_SESSION_ID}",
        cancel_url: host + "/user/usage",
        line_items: [
          {
            price: plan,
            quantity: 1,
          },
        ],
      },
    ) as wire.FieldValue

    bot.addResult("checkoutResult", checkoutResult)
  } else {
    bot.runIntegrationAction(STRIPE_INTEGRATION, "subscription_update", {
      id: subscription.id,
      items: [
        {
          id: subscription.items.data[0].id,
          price: plan,
        },
      ],
    })

    const loadresult = bot.load({
      collection: "uesio/studio.usage_plan",
      conditions: [
        {
          field: "uesio/studio.external_plan_id",
          value: plan,
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
}
