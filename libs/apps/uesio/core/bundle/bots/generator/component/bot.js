function collection(bot) {
	var pack = bot.params.get("pack")
	var name = bot.params.get("name")
	var type = bot.params.get("type")
	var componentName = `${name.charAt(0).toUpperCase() + name.slice(1)}`
	if (type === "DECLARATIVE") {
		// Generate the Declarative Component YAML file
		bot.generateFile(
			`components/${name}.yaml`,
			{
				componentName,
				name,
			},
			"templates/declarativeComponent.template.yaml"
		)
	} else {
		// Generate the React component starter TSX file
		bot.generateFile(
			`componentpacks/${pack}/src/components/${name}/${name}.tsx`,
			{},
			"templates/reactComponent.template.tsx"
		)
		// Generate the component YAML file
		bot.generateFile(
			`components/${name}.yaml`,
			{
				componentName,
				name,
				pack,
			},
			"templates/reactComponent.template.yaml"
		)
	}
}
