function collection(bot) {
	var pack = bot.params.get("pack")
	var name = bot.params.get("name")
	var componentName = `${name.charAt(0).toUpperCase() + name.slice(1)}`
	// Generate the component TSX file
	bot.generateFile(
		`componentpacks/${pack}/src/components/${name}/${name}.tsx`,
		{
			componentName,
		},
		"templates/component.template.tsx"
	)
	// Generate the component YAML file
	bot.generateFile(
		`components/${name}.yaml`,
		{
			componentName,
			name,
			pack,
		},
		"templates/component.template.yaml"
	)
}
