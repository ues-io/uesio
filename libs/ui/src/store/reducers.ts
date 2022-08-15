import toPath from "lodash/toPath"
import yaml, { YAMLMap, YAMLSeq } from "yaml"
import {
	ChangeDefinitionKeyPayload,
	CloneDefinitionPayload,
	MoveDefinitionPayload,
} from "../bands/builder"
import {
	isNumberIndex,
	getKeyAtPath,
	getParentPath,
	getIndexFromPath,
} from "../component/path"
import { DefinitionMap } from "../definition/definition"

import { getNodeAtPath, parse } from "../yamlutils/yamlutils"
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
			"That type of Yaml movement is not supported... yet"
		)
	state.content = yamlDoc.toString()
	state.parsed = yamlDoc.toJSON()
}

const cloneDef = (state: MetadataState, { path }: CloneDefinitionPayload) => {
	const isArrayItemClone = isNumberIndex(getKeyAtPath(path))
	const yamlDoc = parse(state.content)
	const parentPath = getParentPath(path)

	if (isArrayItemClone) {
		const index = getIndexFromPath(path)
		if (!index && index !== 0) return
		const { items } = getNodeAtPath(parentPath, yamlDoc.contents) as YAMLSeq
		items.splice(index, 0, items[index])
	} else {
		const newKey =
			(getKeyAtPath(path) || "") + (Math.floor(Math.random() * 60) + 1)
		const node = getNodeAtPath(path, yamlDoc.contents)
		const parentNode = getNodeAtPath(
			parentPath,
			yamlDoc.contents
		) as YAMLMap
		parentNode.setIn([newKey], node)
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
	// Stop if old and new key are equal
	if (getKeyAtPath(path) === newKey) return
	// create a new document so components using useYaml will rerender
	const yamlDoc = parse(state.content)
	// make a copy so we can place with a new key and delete the old node
	const newNode = yamlDoc.getIn(pathArray)
	// replace the old with the new key
	pathArray.splice(-1, 1, newKey)

	/*
	Keys need to be unique.
	TEST:oldKeyEqualsNew
	*/
	if (yamlDoc.getIn(pathArray)) return

	yamlDoc.setIn(pathArray, newNode)
	yamlDoc.deleteIn(toPath(path))
	state.content = yamlDoc.toString()
	state.parsed = yamlDoc.toJSON()
}

export { removeDef, addDef, setDef, moveDef, cloneDef, changeDefKey }
