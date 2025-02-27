function run(bot) {
  const name = bot.params.get("name")
  const path = bot.params.get("path")
  const title = bot.params.get("title")
  const subtitle = bot.params.get("subtitle")

  const collection = bot.params.get("collection")
  const collectionParts = collection?.split(".")
  const collectionName = collectionParts[1]
  const wireName = collectionName
  const fields = bot.params.get("fields")

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
      title,
      subtitle,
      formFields,
      fields: fieldsYaml,
      wirename: wireName,
      collection,
    },
    "templates/landing.yaml",
  )
  bot.runGenerator("uesio/core", "view", {
    name,
    definition,
  })
  bot.runGenerator("uesio/core", "route", {
    name,
    path,
    view: name,
    theme: "uesio/core.default",
    title: "Landing Page",
  })
}
