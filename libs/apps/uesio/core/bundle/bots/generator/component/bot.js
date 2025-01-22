function generate(bot) {
  const pack = bot.params.get("pack")
  const name = bot.params.get("name")
  const type = bot.params.get("type")
  const definition = bot.params.get("definition")
  const componentName = `${name.charAt(0).toUpperCase() + name.slice(1)}`
  if (type === "DECLARATIVE") {
    if (definition) {
      bot.generateStringFile(`components/${name}.yaml`, definition)
      return
    }
    // Generate the Declarative Component YAML file
    bot.generateFile(
      `components/${name}.yaml`,
      {
        componentName,
        name,
      },
      "templates/declarativeComponent.template.yaml",
    )
    return
  }
  // Generate the React component starter TSX file
  bot.generateFile(
    `componentpacks/${pack}/src/components/${name}/${name}.tsx`,
    {},
    "templates/reactComponent.template.tsx",
  )
  // Generate the component YAML file
  bot.generateFile(
    `components/${name}.yaml`,
    {
      componentName,
      name,
      pack,
    },
    "templates/reactComponent.template.yaml",
  )
}
