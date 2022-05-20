import toPath from "lodash/toPath"
import yaml, { isCollection, YAMLMap, YAMLSeq } from "yaml"
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
	getGrandParentPath,
} from "../component/path"
import { DefinitionMap } from "../definition/definition"

import {
	addNodeAtPath,
	getNodeAtPath,
	parse,
	removeNodeAtPath,
	setNodeAtPath,
} from "../yamlutils/yamlutils"
import { MetadataState } from "../bands/metadata/types"

type MoveType =
	| "pairWithinParent"
	| "pairToParent"
	| "seqIndexMove"
	| "seqToSeq"
	| "unknown"

/**
 * Change the index of an element in an array, this modifies the array.
 */
const moveInArray = (
	arr: unknown[],
	oldIndex: number | string,
	newIndex: number | string
) => arr.splice(Number(newIndex), 0, arr.splice(Number(oldIndex), 1)[0])

const setDef = (state: MetadataState, payload: SetDefinitionPayload) => {
	const { path, definition } = payload

	if (!state.content) return
	const yamlDoc = parse(state.content)
	const pathArray = toPath(path)
	const parentPath = getParentPath(pathArray)
	const parentNode = yamlDoc.getIn(parentPath)
	// create a new document so components using useYaml will rerender
	// --
	// if the parent is "null" or "undefined", the yaml library won't set our pair in the object.
	// We need to
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
	const { fromPath: originalPath, toPath: destinationPath } = payload
	const originalParentPath = getParentPath(originalPath)
	const destinationParentPath = getParentPath(destinationPath)
	const yamlDoc = parse(state.content)
	const parentNode = yamlDoc.getIn(toPath(originalParentPath)) as yaml.Node
	const isArrayMove = yaml.isSeq(parentNode)

	const fromKey = getKeyAtPath(originalPath)
	const toKey = getKeyAtPath(destinationPath)
	if (!fromKey || !toKey) return console.warn("missing keys for moveDef")

	const isSameParent = originalParentPath === destinationParentPath

	const moveType = [
		["pairWithinParent", isSameParent && !isArrayMove],
		["pairToParent", !isSameParent && !isArrayMove],
		["seqIndexMove", isArrayMove && isSameParent],
		["seqToSeq", isArrayMove && !isSameParent],
		["unknown", true],
	].find(([, c]) => c)?.[0] as MoveType

	if (moveType === "pairWithinParent") {
		const definition = getDefFromPath(state, originalParentPath)
		if (!definition) return console.warn("missing definition for moveDef")
		// Turn object into array so it's easier to re-order
		const keys = Object.entries(definition)
		// Get the array indices and move them around, bring back to a definition and set it
		const fromIndex = keys.findIndex(([k]) => k === fromKey)
		const toIndex = keys.findIndex(([k]) => k === toKey)
		moveInArray(keys, fromIndex, toIndex)
		const newDefinition = Object.fromEntries(keys)

		return setDef(state, {
			path: destinationParentPath,
			definition: newDefinition,
		})
	}

	// We're moving items around within the same aray, that's easy
	if (moveType === "seqIndexMove")
		moveInArray((parentNode as YAMLSeq).items, fromKey, toKey)

	if (moveType === "seqToSeq" && isArrayMove) {
		const destinationNode = yamlDoc.getIn(
			toPath(destinationParentPath)
		) as YAMLSeq
		// Append cutout to destination array + move it to the desired index + delete old
		destinationNode.add(yamlDoc.getIn(toPath(originalPath)))
		moveInArray(
			destinationNode.items,
			destinationNode.items.length - 1,
			toKey
		)
		yamlDoc.deleteIn(toPath(originalPath))
	}

	if (moveType === "unknown")
		return console.warn(
			"That type of Yanl movement is not supported... yet"
		)
	state.content = yamlDoc.toString()
	state.parsed = yamlDoc.toJSON()
}

const addDefPair = (
	state: MetadataState,
	payload: AddDefinitionPairPayload
) => {
	const { path, definition, key } = payload
	// create a new document so components using useYaml will rerender
	const yamlDoc = parse(state.content)
	const newNode = yamlDoc.createNode(definition)

	// addNodePairAtPath(toPath(path), yamlDoc.contents, newNode, key)
	// TODO: for now we can use addNodeAtPath here under the hood, until we refactor the functions using the builder.addDefPair to use builder.addNode
	addNodeAtPath([...path, key], yamlDoc.contents, newNode, 0)
	state.content = yamlDoc.toString()
	state.parsed = yamlDoc.toJSON()
}

const cloneDef = (state: MetadataState, { path }: CloneDefinitionPayload) => {
	const parentPath = getParentPath(path)
	const isArrayItemClone = isNumberIndex(getKeyAtPath(parentPath))
	const yamlDoc = parse(state.content)

	if (isArrayItemClone) {
		const index = getIndexFromPath(parentPath)
		if (!index && index !== 0) return
		const grandParentPath = getGrandParentPath(path)
		const { items } = getNodeAtPath(
			grandParentPath,
			yamlDoc.contents
		) as YAMLSeq
		items.splice(index, 0, items[index])
	} else {
		const newKey =
			(getKeyAtPath(path) || "") + (Math.floor(Math.random() * 60) + 1)
		const node = getNodeAtPath(path, yamlDoc.contents)
		const { setIn } = getNodeAtPath(parentPath, yamlDoc.contents) as YAMLMap
		setIn([newKey], node)
	}
	state.content = yamlDoc.toString()
	state.parsed = yamlDoc.toJSON()
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
