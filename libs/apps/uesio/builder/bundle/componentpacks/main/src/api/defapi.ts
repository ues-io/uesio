import { definition, api } from "@uesio/ui"
import { FullPath } from "./path"

const get = (path: FullPath): definition.Definition => {
	if (path === undefined) return
	return api.builder.getDefinitionAtPath(path.pathCombine())
}

const set = (
	path: FullPath,
	definition: definition.Definition,
	autoSelect?: boolean
) => {
	api.builder.setDefinition(path.pathCombine(), definition, autoSelect)
}

const remove = (path: FullPath) => {
	api.builder.removeDefinition(path.pathCombine())
}

const add = (
	path: FullPath,
	definition: definition.Definition,
	index?: number
) => {
	api.builder.addDefinition(path.pathCombine(), definition, index)
}

const move = (fromPath: FullPath, toPath: FullPath, selectKey?: string) => {
	api.builder.moveDefinition(
		fromPath.pathCombine(),
		toPath.pathCombine(),
		selectKey
	)
}

const clone = (path: FullPath) => {
	api.builder.cloneDefinition(path.pathCombine())
}

const cloneKey = (path: FullPath) => {
	api.builder.cloneKeyDefinition(path.pathCombine())
}

const useContent = (path: FullPath) =>
	api.builder.useDefinitionContent(path.itemType, path.itemName) || ""

const setContent = (path: FullPath, value: string) => {
	api.builder.setDefinitionContent(path.itemType, path.itemName, value || "")
}

export { set, add, remove, move, get, clone, cloneKey, useContent, setContent }
