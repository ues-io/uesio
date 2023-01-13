import { component, api, util, definition } from "@uesio/ui"

const getValueAPI = (
	metadataType: string,
	metadataItem: string,
	selectedPath: string,
	definition: definition.DefinitionMap | undefined
) => ({
	get: (path: string) => util.get(definition, path),
	set: (
		path: string,
		value: string | number | null,
		autoSelect?: boolean
	) => {
		if (path === undefined) return
		api.builder.setDefinition(
			component.path.makeFullPath(metadataType, metadataItem, path),
			value,
			autoSelect
		)
	},
	clone: (path: string) => {
		if (path === undefined) return
		api.builder.cloneDefinition(
			component.path.makeFullPath(metadataType, metadataItem, path)
		)
	},
	cloneKey: (path: string) => {
		if (path === undefined) return
		api.builder.cloneKeyDefinition(
			component.path.makeFullPath(metadataType, metadataItem, path)
		)
	},
	add: (path: string, value: string, number?: number) => {
		if (path === undefined) return
		api.builder.addDefinition(
			component.path.makeFullPath(metadataType, metadataItem, path),
			value,
			number
		)
	},
	remove: (path: string) => {
		if (path === undefined) return
		api.builder.removeDefinition(
			component.path.makeFullPath(metadataType, metadataItem, path)
		)
	},
	changeKey: (path: string, key: string) => {
		if (path === undefined) return
		api.builder.changeDefinitionKey(
			component.path.makeFullPath(metadataType, metadataItem, path),
			key
		)
	},
	move: (fromPath: string, toPath: string, selectKey?: string) => {
		if (fromPath === undefined || toPath === undefined) return
		api.builder.moveDefinition(
			component.path.makeFullPath(metadataType, metadataItem, fromPath),
			component.path.makeFullPath(metadataType, metadataItem, toPath),
			selectKey
		)
	},
	select: () => {
		//api.builder.setSelectedNode(metadataType, metadataItem, path)
	},
	isSelected: (path: string) => path === selectedPath,
	hasSelectedChild: (path: string) =>
		selectedPath.startsWith(path) && path !== selectedPath,
})

export default getValueAPI
