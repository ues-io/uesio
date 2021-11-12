import { definition, component, util, hooks } from "@uesio/ui"

export const ComponentVariantDefValueAPI = (
	metadataType: string,
	metadataItem: string,
	uesio: hooks.Uesio,
	viewDefId: string | undefined,
	definition: definition.DefinitionMap
) => ({
	get: (path: string) => {
		console.log("GET 1", { definition, path })
		const test = util.get(definition, path)
		console.log("GET", test)
		return test
	},
	set: (path: string, value: string | number | null) => {
		if (path === undefined) return
		const fullpath = component.path.makeFullPath(
			metadataType,
			metadataItem,
			path
		)
		console.log("SET", { fullpath, value })
		uesio.builder.setDefinition(fullpath, value)
	},
	clone: (path: string) =>
		uesio.builder.cloneDefinition(
			component.path.makeFullPath("viewdef", viewDefId || "", path)
		),
	add: (path: string, value: string, number?: number) => {
		if (path === undefined) return
		uesio.builder.addDefinition(
			component.path.makeFullPath(metadataType, metadataItem, path),
			value,
			number
		)
	},
	addPair: (path: string, value: string, key: string) => {
		if (path === undefined) return
		uesio.builder.addDefinitionPair(
			component.path.makeFullPath(metadataType, metadataItem, path),
			value,
			key
		)
	},
	remove: (path: string) => {
		if (path === undefined) return
		uesio.builder.removeDefinition(
			component.path.makeFullPath(metadataType, metadataItem, path)
		)
	},
	changeKey: (path: string, key: string) => {
		if (path === undefined) return
		uesio.builder.changeDefinitionKey(
			component.path.makeFullPath(metadataType, metadataItem, path),
			key
		)
	},
	move: (fromPath: string, toPath: string, selectKey?: string) => {
		if (fromPath === undefined || toPath === undefined) return
		uesio.builder.moveDefinition(
			component.path.makeFullPath(metadataType, metadataItem, fromPath),
			component.path.makeFullPath(metadataType, metadataItem, toPath),
			selectKey
		)
	},
})

export default ComponentVariantDefValueAPI
