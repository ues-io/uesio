function field(bot) {
  function getDefinition(template, parameters) {
    var params = parameters.reduce((prev, key) => {
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

  var name = bot.params.get("name")
  var collectionKey = bot.params.get("collection")
  var type = bot.params.get("type")
  var label = bot.params.get("label")

  //Common part for all fields
  var common_definition = bot.mergeYamlTemplate(
    {
      name: name,
      type: type,
      label: label,
      collection: collectionKey,
    },
    "templates/common.yaml",
  )

  var number_definition = getDefinition("templates/number.yaml", [
    "number_decimals",
  ])
  var reference_definition = getDefinition("templates/reference.yaml", [
    "ref_collection",
  ])
  var selectlist_definition = getDefinition("templates/selectlist.yaml", [
    "select_list",
  ])
  var autonumber_definition = getDefinition("templates/autonumber.yaml", [
    "autonumber_prefix",
    "autonumber_leadingzeros",
  ])

  var file_definition = getDefinition("templates/file.yaml", ["accept"])
  var referencegroup_definition = getDefinition(
    "templates/referencegroup.yaml",
    [
      "referencegroup_collection",
      "referencegroup_field",
      "referencegroup_ondelete",
    ],
  )

  var field = [
    common_definition,
    number_definition,
    reference_definition,
    selectlist_definition,
    autonumber_definition,
    file_definition,
    referencegroup_definition,
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
