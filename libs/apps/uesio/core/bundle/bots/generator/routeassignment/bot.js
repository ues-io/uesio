function run(bot) {
  const type = bot.params.get("type")
  const route = bot.params.get("route")
  const collection = bot.params.get("collection")
  const collectionParts = collection.split(".")
  const collectionNamespace = collectionParts[0]
  const collectionName = collectionParts[1]

  bot.generateFile(
    `routeassignments/${collectionNamespace}/${collectionName}/${type}.yaml`,
    {
      type,
      route,
    },
    "templates/routeassignment.yaml",
  )
}
