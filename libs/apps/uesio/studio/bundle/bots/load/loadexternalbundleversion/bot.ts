import { LoadBotApi } from "@uesio/bots"

type ApiResponse = {
  version: string
  description: string
}

export default function loadexternalbundleversion(bot: LoadBotApi) {
  const { conditions } = bot.loadRequest

  const bundleStoreBaseUrl = bot.getConfigValue("uesio/studio.external_bundle_store_base_url")

  const externalBundleVersionUniquekey = conditions?.find(
    (condition) => condition.id === "externalBundleVersionUniquekey",
  )

  const bundleVersionValue = externalBundleVersionUniquekey?.value as
    | string
    | undefined

  if (!bundleVersionValue) {
    bot.addError("Missing Uniquekey")
    return
  }

  const url = new URL(`versions/${bundleVersionValue}/list`, bundleStoreBaseUrl)

  const response = bot.http.request({
    method: "GET",
    url: url.href,
  })
  const apiResponse = response.body as unknown as ApiResponse[]
  apiResponse.forEach((record) =>
    bot.addRecord({
      "uesio/studio.version": record.version,
      "uesio/studio.description": record.description,
    }),
  )
}
