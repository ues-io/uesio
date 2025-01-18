function view_footer(bot) {
  const namespace = bot.getAppName()
  const categories = bot.params.get("categories")
  const logoFile = bot.params.get("logoFile")
  const logoFilePath = bot.params.get("logoFilePath")

  const categoriesYaml = categories
    .map((category) => {
      const buttonsYaml = category.links
        .map((link) => {
          return bot.mergeYamlTemplate(
            {
              name: link.name,
              variant: "uesio/sitekit.footer_link",
            },
            "templates/button.yaml",
          )
        })
        .join("")

      return bot.mergeYamlTemplate(
        {
          title: category.name,
          buttonsYaml,
        },
        "templates/category.yaml",
      )
    })
    .join("")

  var definition = bot.mergeYamlTemplate(
    {
      namespace,
      categoriesYaml,
      logoFile,
      logoFilePath,
    },
    "templates/footer.yaml",
  )
  bot.runGenerator("uesio/core", "view", {
    name: "footer",
    definition,
  })
}
