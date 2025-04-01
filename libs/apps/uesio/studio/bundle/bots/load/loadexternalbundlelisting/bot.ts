import { LoadBotApi } from "@uesio/bots"

type ApiResponse = {
  app: string
  description: string
  icon: string
  color: string
}

export default function loadexternalbundlelisting(bot: LoadBotApi) {
  const { conditions } = bot.loadRequest

  const bundleStoreBaseUrl = bot.getConfigValue("uesio/studio.external_bundle_store_base_url")
  const url = new URL("site/bundles/v1/list", bundleStoreBaseUrl)

  const response = bot.http.request({
    method: "GET",
    url: url.href,
  })

  let apiResponse = response.body as unknown as ApiResponse[]

  const externalBundleListingUniquekey = conditions?.find(
    (condition) => condition.id === "externalBundleListingUniquekey",
  )

  if (externalBundleListingUniquekey) {
    apiResponse = apiResponse.filter(
      (record) => record.app === externalBundleListingUniquekey.value,
    )
  }

  apiResponse.forEach((record) =>
    bot.addRecord({
      "uesio/studio.uniquekey": record.app,
      "uesio/studio.description": record.description,
      "uesio/studio.approved": true,
      "uesio/studio.app": {
        "uesio/core.uniquekey": record.app,
        "uesio/studio.color": record.color,
        "uesio/studio.icon": record.icon,
        "uesio/studio.fullname": record.app,
      },
    }),
  )
}
