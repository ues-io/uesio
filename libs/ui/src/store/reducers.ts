import toPath from "lodash/toPath"
import yaml from "yaml"
import {
	AddDefinitionPairPayload,
	AddDefinitionPayload,
	ChangeDefinitionKeyPayload,
	CloneDefinitionPayload,
	MoveDefinitionPayload,
	RemoveDefinitionPayload,
	SetDefinitionPayload,
} from "../bands/builder"
import {
	isNumberIndex,
	getKeyAtPath,
	getParentPath,
	getIndexFromPath,
} from "../component/path"
import { DefinitionMap } from "../definition/definition"

import {
	addNodeAtPath,
	addNodePairAtPath,
	getNodeAtPath,
	parse,
	removeNodeAtPath,
	setNodeAtPath,
} from "../yamlutils/yamlutils"
import { MetadataState } from "../bands/metadata/types"

const setDef = (state: MetadataState, payload: SetDefinitionPayload) => {
	const { path, definition } = payload

	if (!state.content) return

	const yamlDoc = parse(state.content)
	const pathArray = toPath(path)

	const parentPath = pathArray.slice(0, pathArray.length - 1)
	const parentNode = yamlDoc.getIn(parentPath) as yaml.Node
	// const parentDef = parentNode.toJSON()

	// create a new document so components using useYaml will rerender
	// --
	// A bit of a hack to  add a key pair value if the parent is null || undefined.
	// Example: "- uesio/io.text: null" and we want to update the text prop.
	// It only works for 1 level of non-existence
	const newNodeSrc = parentNode
		? definition
		: {
				[`${toPath(path).pop()}`]: definition,
		  }

	const pathToUpdate = parentNode ? pathArray : parentPath
	const newNode = yamlDoc.createNode(newNodeSrc)

	setNodeAtPath(pathToUpdate, yamlDoc.contents, newNode)
	state.content = yamlDoc.toString()
	state.parsed = yamlDoc.toJSON()
}

const addDef = (state: MetadataState, payload: AddDefinitionPayload) => {
	const { path, definition, index } = payload

	if (state.content && definition) {
		const yamlDoc = parse(state.content)
		const newNode = yamlDoc.createNode(definition)
		const pathArray = toPath(path)
		if (newNode) {
			addNodeAtPath(pathArray, yamlDoc.contents, newNode, index || 0)
		}
		state.content = yamlDoc.toString()
		state.parsed = yamlDoc.toJSON()
	}
}

const removeDef = (state: MetadataState, payload: RemoveDefinitionPayload) => {
	const pathArray = toPath(payload.path)
	const index = pathArray.pop() // Get the index
	if (index) {
		const yamlDoc = parse(state.content)
		removeNodeAtPath(pathArray.concat([index]), yamlDoc.contents)
		state.content = yamlDoc.toString()
		state.parsed = yamlDoc.toJSON()
	}
}

const getDefFromPath = (state: MetadataState, path: string | string[]) => {
	const yamlDoc = parse(state.content)
	const defNode = getNodeAtPath(path, yamlDoc.contents)
	return defNode?.toJSON() as DefinitionMap
}

const moveDef = (state: MetadataState, payload: MoveDefinitionPayload) => {
	const isArrayMove = isNumberIndex(getKeyAtPath(payload.toPath))
	const { fromPath: originalPath, toPath: destinationPath } = payload
	const originalParentPath = getParentPath(originalPath)
	const destinationParentPath = getParentPath(destinationPath)

	if (!isArrayMove) {
		if (originalParentPath !== destinationParentPath) return
		const fromKey = getKeyAtPath(originalPath)
		const toKey = getKeyAtPath(destinationPath)
		const definition = getDefFromPath(state, originalParentPath)

		if (!definition || !fromKey || !toKey) return

		// Turn object into array so it's easier to re-order
		const keys = Object.entries(definition)
		const fromIndex = keys.findIndex(([k]) => k === fromKey)
		const toIndex = keys.findIndex(([k]) => k === toKey)
		const cutOut = keys.splice(fromIndex, 1)[0]
		keys.splice(toIndex, 0, cutOut) // insert cutout at index
		const newDefinition = Object.fromEntries(keys)

		return setDef(state, {
			path: destinationParentPath,
			definition: newDefinition,
		})
	}

	//Grab current definition
	const definition = getDefFromPath(state, originalPath)
	//Remove the original
	removeDef(state, { path: originalPath })
	const index = Number(getKeyAtPath(destinationPath) || "")

	//Add back in the intended spot
	addDef(state, {
		definition,
		index,
		path: destinationParentPath,
	})
}

const addDefPair = (
	state: MetadataState,
	payload: AddDefinitionPairPayload
) => {
	const { path, definition, key } = payload

	if (state.content) {
		// create a new document so components using useYaml will rerender
		const yamlDoc = parse(state.content)
		const newNode = yamlDoc.createNode(definition)

		addNodePairAtPath(toPath(path), yamlDoc.contents, newNode, key)

		state.content = yamlDoc.toString()
		state.parsed = yamlDoc.toJSON()
	}
}

const cloneDef = (state: MetadataState, { path }: CloneDefinitionPayload) => {
	const parentPath = getParentPath(path)
	const isArrayClone = isNumberIndex(getKeyAtPath(parentPath))
	if (isArrayClone) {
		const index = getIndexFromPath(parentPath)
		if (!index && index !== 0) return

		const yamlDoc = parse(state.content)
		const defNode = getNodeAtPath(toPath(parentPath), yamlDoc.contents)
		const definition = defNode?.toJSON() as DefinitionMap

		addDef(state, {
			path: getParentPath(parentPath),
			definition,
			index: index + 1,
		})
	} else {
		const newKey =
			(getKeyAtPath(path) || "") + (Math.floor(Math.random() * 60) + 1)

		const yamlDoc = parse(state.content)
		const defNode = getNodeAtPath(toPath(path), yamlDoc.contents)
		const definition = defNode?.toJSON() as DefinitionMap

		addDefPair(state, {
			path: parentPath,
			definition,
			key: newKey,
		})
	}
}

const changeDefKey = (
	state: MetadataState,
	payload: ChangeDefinitionKeyPayload
) => {
	const { path, key: newKey } = payload
	const pathArray = toPath(path)
	// create a new document so components using useYaml will rerender
	const yamlDoc = parse(state.content)
	// make a copy so we can place with a new key and delete the old node
	const newNode = yamlDoc.getIn(toPath(path))
	// replace the old with the new key
	pathArray.splice(-1, 1, newKey)
	yamlDoc.setIn(pathArray, newNode)
	yamlDoc.deleteIn(toPath(path))
	state.content = yamlDoc.toString()
	state.parsed = yamlDoc.toJSON()
}

export {
	removeDef,
	addDef,
	setDef,
	moveDef,
	cloneDef,
	addDefPair,
	changeDefKey,
}
