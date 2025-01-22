function generate(bot) {
  const appName = bot.getAppName()
  const instructions = bot.params.get("instructions")

  const collectionMeta = bot.load({
    collection: "uesio/core.collection",
    conditions: [
      {
        field: "uesio/core.namespace",
        value: appName,
      },
    ],
  })

  // Loop over the collections to generate sample data for.
  bot.runGenerators(
    collectionMeta.map((collection) => ({
      namespace: "uesio/appkit",
      name: "sample_data_collection",
      params: {
        collection: `${collection["uesio/core.namespace"]}.${collection["uesio/core.name"]}`,
        instructions,
      },
    })),
  )
}
