function run(bot) {
  const collection = bot.params.get("collection")
  const collectionParts = collection?.split(".")
  const collectionName = collectionParts[1]
  const wireName = collectionName
  const fields = bot.params.get("fields")
  const namespace = bot.getAppName()

  const builtin = [
    "uesio/core.updatedby",
    "uesio/core.updatedat",
    "uesio/core.createdby",
    "uesio/core.createdat",
    "uesio/core.owner",
  ]

  const fieldsYaml = fields
    .concat(builtin)
    .map((field) => `${field}:\n`)
    .join("")
  const formFields = fields.map((field) => ({
    "uesio/io.field": {
      fieldId: field,
    },
  }))

  const definition = bot.mergeYamlTemplate(
    {
      collection,
      namespace,
      fields: fieldsYaml,
      formFields,
      wirename: wireName,
    },
    "templates/new.yaml",
  )

  bot.runGenerator("uesio/core", "view", {
    name: `${collectionName}_new`,
    definition,
  })

  bot.runGenerator("uesio/core", "route", {
    name: `${collectionName}_new`,
    path: `${collectionName}/new/{recordid}`,
    view: `${collectionName}_new`,
    theme: "uesio/core.default",
    title: `${collectionName} New`,
  })

  bot.runGenerator("uesio/core", "routeassignment", {
    type: "createnew",
    route: `${collectionName}_new`,
    collection,
  })
}
