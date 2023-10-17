import {
	definition,
	api,
	context as ctx,
	component,
	collection,
	platform,
	wire,
} from "@uesio/ui"
import {
	addNodeAtPath,
	getNodeAtPath,
	getParentPathArray,
	parse,
	removeNodeAtPath,
	setNodeAtPath,
} from "../yaml/yamlutils"
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
import yaml from "yaml"
import { validateViewDefinition } from "../yaml/validate"

const moveInArray = (arr: unknown[], fromIndex: number, toIndex: number) =>
	arr.splice(toIndex, 0, arr.splice(fromIndex, 1)[0])

const getMetadataValue = (context: ctx.Context, path: FullPath) => {
	const metadataId = getMetadataId(path)
	return getBuilderState<string>(context, metadataId)
}

const setMetadataValue = (
	context: ctx.Context,
	path: FullPath,
	yamlDoc: yaml.Document.Parsed<yaml.ParsedNode>,
	text?: string // Optionally send the text so we can save a toString call
) => {
	const metadataId = getMetadataId(path)
	const originalMetadataId = `original:${metadataId}`
	const original = getBuilderState<string>(context, originalMetadataId)
	const newTextValue = text || yamlDoc.toString()
	const current = getMetadataValue(context, path)

	const isViewDef = path.itemType === "viewdef"

	// Validate the view definition before proceeding any further
	if (isViewDef) {
		const validationResult = validateViewDefinition(yamlDoc.toJS())

		if (!validationResult) {
			api.signal.run(
				{
					signal: "notification/ADD",
					id: "viewdef-validation",
					severity: "warn",
					text: "View definition is invalid",
					// details: "results"
					path,
				},
				context
			)
			return
		}
	}

	if (original === undefined) {
		setBuilderState(context, originalMetadataId, current)
	}
	if (original && newTextValue === original) {
		removeBuilderState(context, originalMetadataId)
	}
	setBuilderState(context, metadataId, newTextValue)
	if (isViewDef) {
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

	// If the new definition is undefined, interpret this as a "remove"
	if (definition === undefined) {
		remove(context, path)
		return
	}

	const yamlDoc = parse(current)
	const pathArray = component.path.toPath(path.localPath)
	const parentPath = getParentPathArray(pathArray)
	const parentNode = yamlDoc.getIn(parentPath)
	// if the parent is "null" or "undefined", the yaml library won't set our pair in the object.
	const newNodeSrc = parentNode
		? definition
		: { [`${component.path.toPath(path.localPath).pop()}`]: definition }
	const pathToUpdate = parentNode ? pathArray : parentPath
	const newNode = yamlDoc.createNode(newNodeSrc)
	setNodeAtPath(pathToUpdate, yamlDoc.contents, newNode)

	setMetadataValue(context, path, yamlDoc)

	if (autoSelect) {
		setSelectedPath(context, path)
	}
}

const remove = (context: ctx.Context, path: FullPath) => {
	const current = getMetadataValue(context, path)
	if (!current) return

	const pathArray = component.path.toPath(path.localPath)
	const yamlDoc = parse(current)
	removeNodeAtPath(pathArray, yamlDoc.contents)

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

	const yamlDoc = parse(current)
	const newNode = yamlDoc.createNode(definition)
	addNodeAtPath(
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

const yamlMove = (
	yamlDoc: yaml.Document,
	fromPath: FullPath,
	toPath: FullPath
) => {
	// First get the content of the from item
	const fromNode = getNodeAtPath(fromPath.localPath, yamlDoc.contents)
	const fromParentPath = component.path.getParentPath(fromPath.localPath)
	const fromParent = getNodeAtPath(fromParentPath, yamlDoc.contents)
	const toParentPath = component.path.getParentPath(toPath.localPath)
	const clonedNode = fromNode?.clone()
	const isArrayMove = yaml.isSeq(fromParent)
	const isMapMove = yaml.isMap(fromParent) && fromParentPath === toParentPath

	if (isArrayMove) {
		if (!yaml.isCollection(clonedNode)) return
		const index = component.path.getIndexFromPath(toPath.localPath) || 0
		if (fromParentPath === toParentPath) {
			const fromIndex =
				component.path.getIndexFromPath(fromPath.localPath) || 0
			// When in the same list parent, we can just swap
			moveInArray(fromParent.items, fromIndex, index)
		} else {
			// Set that content at the to item
			addNodeAtPath(toParentPath, yamlDoc.contents, clonedNode, index)

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
			(item) => (item.key as yaml.Scalar).value === fromKey
		)
		const toIndex = fromParent.items.findIndex(
			(item) => (item.key as yaml.Scalar).value === toKey
		)
		const temp = fromParent.items[fromIndex]
		fromParent.items[fromIndex] = fromParent.items[toIndex]
		fromParent.items[toIndex] = temp
	}
}

const move = (context: ctx.Context, fromPath: FullPath, toPath: FullPath) => {
	if (toPath.itemType !== fromPath.itemType) return
	if (toPath.itemName !== fromPath.itemName) return
	const toCurrent = getMetadataValue(context, toPath)
	if (!toCurrent) return
	const yamlDoc = parse(toCurrent)
	yamlMove(yamlDoc, fromPath, toPath)
	setMetadataValue(context, toPath, yamlDoc)
	setSelectedPath(context, toPath)
}

const clone = (
	context: ctx.Context,
	path: FullPath,
	purgeProperties?: string[]
) => {
	const current = getMetadataValue(context, path)
	if (!current) return

	const yamlDoc = parse(current)
	const parentPath = component.path.getParentPath(path.localPath)
	const index = component.path.getIndexFromPath(path.localPath)
	if (!index && index !== 0) return
	const parentNode = getNodeAtPath(parentPath, yamlDoc.contents)
	if (!yaml.isSeq(parentNode)) return
	const items = parentNode.items
	//Purge properties
	const itemToClone = items[index]
	if (!yaml.isCollection(itemToClone)) return
	const itemToCloneComponentType = itemToClone.items[0]
	if (!yaml.isPair(itemToCloneComponentType)) return
	const itemToCloneCopy = itemToClone.clone()

	purgeProperties?.forEach((property) => {
		// Handle clones of Components
		if (itemToCloneCopy.hasIn([itemToCloneComponentType.key, property])) {
			itemToCloneCopy.deleteIn([itemToCloneComponentType.key, property])
		}
		// Handle clones of more normal objects in an array
		if (itemToCloneCopy.has(property)) {
			itemToCloneCopy.delete(property)
		}
	})

	items.splice(index, 0, itemToCloneCopy)
	setMetadataValue(context, path, yamlDoc)
}

const cloneKey = (context: ctx.Context, path: FullPath) => {
	const current = getMetadataValue(context, path)
	if (!current) return

	const newKey =
		(component.path.getKeyAtPath(path.localPath) || "") +
		(Math.floor(Math.random() * 60) + 1)

	const yamlDoc = parse(current)
	const parentPath = component.path.getParentPath(path.localPath)
	const cloneNode = getNodeAtPath(path.localPath, yamlDoc.contents)
	const parentNode = getNodeAtPath(parentPath, yamlDoc.contents)
	if (!yaml.isMap(parentNode)) return
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
	const yamlDoc = parse(current)
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
	setMetadataValue(context, path, parse(value), value)
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

	if (!workspace) {
		api.notification.addError("No Workspace in context", context)
		return
	}
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

	// We do NOT want to use the existing context, because that would put us in workspace context.
	// Here, to save the view (workspace METADATA), we need to save in the Studio context,
	// BUT we have to indicate which workspace and app we are saving for.
	const result = await platform.platform.saveData(
		// THis is a bit hacky, the only way to attach params is via a ViewFrame
		ctx.newContext().addViewFrame({
			view: "",
			viewDef: "",
			params: {
				workspacename: workspace.name,
				app: workspace.app,
			},
		}),
		{
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
		}
	)
	if (result?.wires?.length === 1 && result.wires[0].errors?.length) {
		api.notification.addError(
			"Error saving view: " + result.wires[0].errors[0].message,
			context
		)
		return
	}

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
	yamlMove,
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
