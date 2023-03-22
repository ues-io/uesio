import {
	definition,
	api,
	context as ctx,
	component,
	collection,
	util,
	platform,
	wire,
} from "@uesio/ui"
import { FullPath } from "./path"
import {
	getBuilderExternalState,
	getBuilderExternalStates,
	getBuilderState,
	getSelectedPath,
	removeBuilderState,
	setBuilderState,
	setSelectedPath,
	useBuilderExternalState,
	useBuilderExternalStatesCount,
} from "./stateapi"

const moveInArray = (arr: unknown[], fromIndex: number, toIndex: number) =>
	arr.splice(toIndex, 0, arr.splice(fromIndex, 1)[0])

const getMetadataValue = (context: ctx.Context, path: FullPath) => {
	const metadataId = getMetadataId(path)
	return getBuilderState<string>(context, metadataId)
}

const setMetadataValue = (
	context: ctx.Context,
	path: FullPath,
	yamlDoc: util.yaml.lib.Document.Parsed<util.yaml.lib.ParsedNode>
) => {
	const metadataId = getMetadataId(path)
	const originalMetadataId = `original:${metadataId}`
	const original = getBuilderState<string>(context, originalMetadataId)
	const newTextValue = yamlDoc.toString()
	const current = getMetadataValue(context, path)
	if (original === undefined) {
		setBuilderState(context, originalMetadataId, current)
	}
	if (original && newTextValue === original) {
		removeBuilderState(context, originalMetadataId)
	}
	setBuilderState(context, metadataId, newTextValue)
	if (path.itemType === "viewdef") {
		api.view.setViewDefinition(path.itemName, yamlDoc.toJSON())
	}
}

const get = (context: ctx.Context, path: FullPath) =>
	api.builder.getDefinitionAtPath(
		path.itemType,
		path.itemName,
		path.localPath
	)

const set = (
	context: ctx.Context,
	path: FullPath,
	definition: definition.Definition,
	autoSelect?: boolean
) => {
	const current = getMetadataValue(context, path)
	if (!current) return
	const yamlDoc = util.yaml.parse(current)
	const pathArray = component.path.toPath(path.localPath)
	const parentPath = component.path.getParentPathArray(pathArray)
	const parentNode = yamlDoc.getIn(parentPath)
	// if the parent is "null" or "undefined", the yaml library won't set our pair in the object.
	const newNodeSrc = parentNode
		? definition
		: { [`${component.path.toPath(path.localPath).pop()}`]: definition }
	const pathToUpdate = parentNode ? pathArray : parentPath
	const newNode = yamlDoc.createNode(newNodeSrc)
	util.yaml.setNodeAtPath(pathToUpdate, yamlDoc.contents, newNode)

	setMetadataValue(context, path, yamlDoc)

	if (autoSelect) {
		setSelectedPath(context, path)
	}
}

const remove = (context: ctx.Context, path: FullPath) => {
	const current = getMetadataValue(context, path)
	if (!current) return

	const pathArray = component.path.toPath(path.localPath)
	const yamlDoc = util.yaml.parse(current)
	util.yaml.removeNodeAtPath(pathArray, yamlDoc.contents)

	setMetadataValue(context, path, yamlDoc)

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
	definition: definition.Definition,
	autoSelect?: boolean
) => {
	const [index, parent] = path.popIndex()

	const current = getMetadataValue(context, path)
	if (!current) return

	const yamlDoc = util.yaml.parse(current)
	const newNode = yamlDoc.createNode(definition)
	util.yaml.addNodeAtPath(
		component.path.toPath(parent.localPath),
		yamlDoc.contents,
		newNode,
		index || 0
	)

	setMetadataValue(context, path, yamlDoc)

	if (autoSelect) {
		setSelectedPath(context, path)
	}
}

const move = (context: ctx.Context, fromPath: FullPath, toPath: FullPath) => {
	if (toPath.itemType !== fromPath.itemType) return
	if (toPath.itemName !== fromPath.itemName) return

	const toCurrent = getMetadataValue(context, toPath)
	if (!toCurrent) return

	const yamlDoc = util.yaml.parse(toCurrent)
	// First get the content of the from item
	const fromNode = util.yaml.getNodeAtPath(
		fromPath.localPath,
		yamlDoc.contents
	)
	const fromParentPath = component.path.getParentPath(fromPath.localPath)
	const fromParent = util.yaml.getNodeAtPath(fromParentPath, yamlDoc.contents)
	const toParentPath = component.path.getParentPath(toPath.localPath)
	const clonedNode = fromNode?.clone()
	if (!util.yaml.lib.isCollection(clonedNode)) return
	const isArrayMove = util.yaml.lib.isSeq(fromParent)
	const isMapMove =
		util.yaml.lib.isMap(fromParent) && fromParentPath === toParentPath

	if (isArrayMove) {
		const index = component.path.getIndexFromPath(toPath.localPath) || 0
		if (fromParentPath === toParentPath) {
			const fromIndex =
				component.path.getIndexFromPath(fromPath.localPath) || 0
			// When in the same list parent, we can just swap
			moveInArray(fromParent.items, fromIndex, index)
		} else {
			// Set that content at the to item
			util.yaml.addNodeAtPath(
				toParentPath,
				yamlDoc.contents,
				clonedNode,
				index
			)

			// Loop over the items of the from parent
			fromParent.items.forEach((item, index) => {
				if (item === fromNode) {
					fromParent.items.splice(index, 1)
				}
			})
		}
	}
	if (isMapMove) {
		const fromKey = component.path.getKeyAtPath(fromPath.localPath)
		const toKey = component.path.getKeyAtPath(toPath.localPath)
		const fromIndex = fromParent.items.findIndex(
			(item) => (item.key as util.yaml.lib.Scalar).value === fromKey
		)
		const toIndex = fromParent.items.findIndex(
			(item) => (item.key as util.yaml.lib.Scalar).value === toKey
		)
		const temp = fromParent.items[fromIndex]
		fromParent.items[fromIndex] = fromParent.items[toIndex]
		fromParent.items[toIndex] = temp
	}

	setMetadataValue(context, toPath, yamlDoc)

	setSelectedPath(context, toPath)
}

const clone = (context: ctx.Context, path: FullPath) => {
	const current = getMetadataValue(context, path)
	if (!current) return

	const yamlDoc = util.yaml.parse(current)
	const parentPath = component.path.getParentPath(path.localPath)
	const index = component.path.getIndexFromPath(path.localPath)
	if (!index && index !== 0) return
	const parentNode = util.yaml.getNodeAtPath(parentPath, yamlDoc.contents)
	if (!util.yaml.lib.isSeq(parentNode)) return
	const items = parentNode.items
	items.splice(index, 0, items[index])

	setMetadataValue(context, path, yamlDoc)
}

const cloneKey = (context: ctx.Context, path: FullPath) => {
	const current = getMetadataValue(context, path)
	if (!current) return

	const newKey =
		(component.path.getKeyAtPath(path.localPath) || "") +
		(Math.floor(Math.random() * 60) + 1)

	const yamlDoc = util.yaml.parse(current)
	const parentPath = component.path.getParentPath(path.localPath)
	const cloneNode = util.yaml.getNodeAtPath(path.localPath, yamlDoc.contents)
	const parentNode = util.yaml.getNodeAtPath(parentPath, yamlDoc.contents)
	if (!util.yaml.lib.isMap(parentNode)) return
	parentNode.setIn([newKey], cloneNode)

	setMetadataValue(context, path, yamlDoc)
}

const changeKey = (context: ctx.Context, path: FullPath, key: string) => {
	const pathArray = component.path.toPath(path.localPath)

	const current = getMetadataValue(context, path)
	if (!current) return

	// Stop if old and new key are equal
	if (component.path.getKeyAtPath(path.localPath) === key) return
	// create a new document so components using useYaml will rerender
	const yamlDoc = util.yaml.parse(current)
	// make a copy so we can place with a new key and delete the old node
	const newNode = yamlDoc.getIn(pathArray)
	// replace the old with the new key
	pathArray.splice(-1, 1, key)

	/*
	Keys need to be unique.
	TEST:oldKeyEqualsNew
	*/
	if (yamlDoc.getIn(pathArray)) {
		api.notification.addNotification(
			`"${key}" already exists.`,
			"error",
			context
		)
		return
	}

	yamlDoc.setIn(pathArray, newNode)
	yamlDoc.deleteIn(component.path.toPath(path.localPath))

	setMetadataValue(context, path, yamlDoc)

	setSelectedPath(context, path.pop()[1].addLocal(key))
}

const useDefinition = (path: FullPath) =>
	api.builder.useDefinition(path.itemType, path.itemName, path.localPath)

const getMetadataId = (path: FullPath) =>
	`metadata:${path.itemType}:${path.itemName}`

const useContent = (context: ctx.Context, path: FullPath) =>
	useBuilderExternalState<string>(context, getMetadataId(path))

const setContent = (context: ctx.Context, path: FullPath, value: string) => {
	setMetadataValue(context, path, util.yaml.parse(value))
}

const useHasChanges = (context: ctx.Context) => {
	const originalEntities = useBuilderExternalStatesCount(
		context,
		"original:metadata:"
	)
	return originalEntities > 0
}

const save = async (context: ctx.Context) => {
	const workspace = context.getWorkspace()

	if (!workspace) throw new Error("No Workspace in context")
	const originalEntities = getBuilderExternalStates(
		context,
		"original:metadata:"
	)

	const viewChanges: Record<string, wire.PlainWireRecord> = {}

	if (originalEntities && originalEntities.length) {
		originalEntities.forEach((entity) => {
			const parts = entity.id.split("original:metadata:")
			const [itemType, itemName] = parts[1].split(":")
			const currentValue = getBuilderExternalState(
				context,
				"metadata:" + parts[1]
			)
			const [, name] = component.path.parseKey(itemName)
			if (itemType === "viewdef") {
				viewChanges[entity.id] = {
					"uesio/studio.definition": currentValue as string,
					[collection.UNIQUE_KEY_FIELD]: `${workspace.app}:${workspace.name}:${name}`,
				}
			}
		})
	}

	await platform.platform.saveData(ctx.newContext(), {
		wires: [
			{
				wire: "saveview",
				collection: "uesio/studio.view",
				changes: viewChanges,
				deletes: {},
				options: {
					upsert: true,
				},
			},
		],
	})

	if (originalEntities && originalEntities.length) {
		originalEntities.forEach((entity) => {
			const parts = entity.id.split("original:metadata:")
			removeBuilderState(context, "original:metadata:" + parts[1])
		})
	}
}

const cancel = (context: ctx.Context) => {
	const originalEntities = getBuilderExternalStates(
		context,
		"original:metadata:"
	)

	if (originalEntities && originalEntities.length) {
		originalEntities.forEach((entity) => {
			const parts = entity.id.split("original:metadata:")
			const [itemType, itemName] = parts[1].split(":")
			const path = new FullPath(itemType, itemName, "")
			setContent(context, path, entity.state as string)
		})
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
	useHasChanges,
	save,
	cancel,
}
