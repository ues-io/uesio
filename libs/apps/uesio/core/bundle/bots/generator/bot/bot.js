function bot(botapi) {
	// Get the name of the context workspace's app
	const app = botapi.getAppName()
	const params = botapi.params.getAll()
	const { name, collection } = params
	const type = (params.type || "LISTENER").toLowerCase()
	const dialect = (params.dialect || "TYPESCRIPT").toLowerCase()
	// In order to avoid conflicts with Generator merges clobbering JS variable merges
	// inside of our Bot template files, we will just replace all JS merges in the template files,
	// e.g. we will just have "ns" => "${ns}", etc.
	const escapeMerges = ["ns"]
	const newBotParams = {
		...params,
		app,
	}
	escapeMerges.forEach((param) => {
		newBotParams[param] = "${" + param + "}"
	})
	// Create the corresponding bot's TS and YAML files
	let path = `bots/${type}`
	if (type === "aftersave" || type === "beforesave") {
		path += `/${collection.replace(".", "/")}`
	}
	path += `/${name}/bot`
	if (dialect === "TYPESCRIPT") {
		botapi.generateFile(
			`${path}.ts`,
			newBotParams,
			`templates/${type}/bot.template.ts`
		)
	}
	botapi.generateFile(
		`${path}.yaml`,
		{ ...params, name },
		`templates/${type}/bot.template.yaml`
	)
}
