import { definition, api, context as ctx, component } from "@uesio/ui"
import { FullPath } from "./path"
import { getSelectedPath, setSelectedPath } from "./stateapi"

const get = (context: ctx.Context, path: FullPath) =>
	api.builder.getDefinitionAtPath(path.pathCombine())

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

	const selectedPath = getSelectedPath(context)
	const [key, poppedSelectedPath] = selectedPath.pop()
	// If we're a component then we may be selected at two paths
	// ["components"]["0"] or ["components"]["0"]["blah/blah.blah"]
	const wasSelected =
		(component.path.isComponentIndex(key) &&
			poppedSelectedPath.equals(path)) ||
		selectedPath.equals(path)

	if (wasSelected) setSelectedPath(context, path.parent())
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

const clone = (context: ctx.Context, path: FullPath) => {
	api.builder.cloneDefinition(path.pathCombine())
}

const cloneKey = (context: ctx.Context, path: FullPath) => {
	api.builder.cloneKeyDefinition(path.pathCombine())
}

const changeKey = (context: ctx.Context, path: FullPath, key: string) => {
	api.builder.changeDefinitionKey(path.pathCombine(), key)
	setSelectedPath(context, path.pop()[1].addLocal(key))
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
	changeKey,
	useContent,
	setContent,
	useDefinition,
}
