function run(bot) {
  function getDefinition(template, parameters) {
    const params = parameters.reduce((prev, key) => {
      const value = bot.params.get(key)

      return value
        ? {
            ...prev,
            [key]: value,
          }
        : prev
    }, null)

    if (!params) return null

    return bot.mergeYamlTemplate(params, template)
  }

  const name = bot.params.get("name")
  const collectionKey = bot.params.get("collection")
  const type = bot.params.get("type")
  const label = bot.params.get("label")

  //Common part for all fields
  const commonDefinition = bot.mergeYamlTemplate(
    {
      name,
      type,
      label,
      collection: collectionKey,
    },
    "templates/common.yaml",
  )

  const numberDefinition = getDefinition("templates/number.yaml", [
    "number_decimals",
  ])
  const referenceDefinition = getDefinition("templates/reference.yaml", [
    "ref_collection",
  ])
  const selectlistDefinition = getDefinition("templates/selectlist.yaml", [
    "select_list",
  ])
  const autonumberDefinition = getDefinition("templates/autonumber.yaml", [
    "autonumber_prefix",
    "autonumber_leadingzeros",
  ])

  const fileDefinition = getDefinition("templates/file.yaml", ["accept"])
  const referencegroupDefinition = getDefinition(
    "templates/referencegroup.yaml",
    [
      "referencegroup_collection",
      "referencegroup_field",
      "referencegroup_ondelete",
    ],
  )

  const field = [
    commonDefinition,
    numberDefinition,
    referenceDefinition,
    selectlistDefinition,
    autonumberDefinition,
    fileDefinition,
    referencegroupDefinition,
  ]
    .filter((val) => val)
    .join("")

  const parts = collectionKey.split(".")
  bot.generateFile(
    "fields/" + parts[0] + "/" + parts[1] + "/" + name + ".yaml",
    {
      definition: field,
    },
    "templates/field.yaml",
  )
}
