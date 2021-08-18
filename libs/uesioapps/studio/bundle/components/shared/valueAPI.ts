import { definition, component, util, hooks } from "@uesio/ui"

export default (
	uesio: hooks.Uesio,
	metadataType: string,
	metadataItem: string
) => ({
	get: (path: string) => util.get(definition, path),
	set: (path: string, value: string) => {
		if (path === undefined) return
		uesio.builder.setDefinition(
			component.path.makeFullPath(metadataType, metadataItem, path),
			value
		)
	},
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
	move: (fromPath: string, toPath: string) => {
		if (fromPath === undefined || toPath === undefined) return
		uesio.builder.moveDefinition(
			component.path.makeFullPath(metadataType, metadataItem, fromPath),
			component.path.makeFullPath(metadataType, metadataItem, toPath)
		)
	},
})
