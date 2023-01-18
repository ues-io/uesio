import { definition, api, context as ctx } from "@uesio/ui"
import { FullPath } from "./path"
import { setSelectedPath } from "./stateapi"

const get = (path: FullPath): definition.Definition => {
	if (path === undefined) return
	return api.builder.getDefinitionAtPath(path.pathCombine())
}

const set = (
	context: ctx.Context,
	path: FullPath,
	definition: definition.Definition,
	autoSelect?: boolean
) => {
	api.builder.setDefinition(path.pathCombine(), definition)
	if (autoSelect) {
		setSelectedPath(context, path)
	}
}

const remove = (context: ctx.Context, path: FullPath) => {
	api.builder.removeDefinition(path.pathCombine())
	setSelectedPath(context)
}

const add = (
	context: ctx.Context,
	path: FullPath,
	definition: definition.Definition
) => {
	const [index, parent] = path.popIndex()
	api.builder.addDefinition(parent.pathCombine(), definition, index)
	//setSelectedPath(context, path)
}

const move = (
	context: ctx.Context,
	fromPath: FullPath,
	toPath: FullPath,
	selectKey?: string
) => {
	api.builder.moveDefinition(
		fromPath.pathCombine(),
		toPath.pathCombine(),
		selectKey
	)
	setSelectedPath(context, toPath)
}

const clone = (path: FullPath) => {
	api.builder.cloneDefinition(path.pathCombine())
}

const cloneKey = (path: FullPath) => {
	api.builder.cloneKeyDefinition(path.pathCombine())
}

const useDefinition = (path: FullPath) =>
	api.builder.useDefinition(path.itemType, path.itemName, path.localPath)

const useContent = (path: FullPath) =>
	api.builder.useDefinitionContent(path.itemType, path.itemName) || ""

const setContent = (path: FullPath, value: string) => {
	if (path.itemType === "viewdef") {
		api.builder.setDefinitionContent(
			path.itemType,
			path.itemName,
			value || ""
		)
	}
}

export {
	set,
	add,
	remove,
	move,
	get,
	clone,
	cloneKey,
	useContent,
	setContent,
	useDefinition,
}
