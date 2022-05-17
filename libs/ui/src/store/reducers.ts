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
	fromPath,
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

	const hasIn = yamlDoc.hasIn(pathArray)
	const hasInParent = yamlDoc.hasIn(parentPath)

	// create a new document so components using useYaml will rerender
	// --
	// A bit of a hack to  add a key pair value if it doesn't exist at path.
	// for instance when component key is like - "uesio/io.text: null" and we want to update the text prop
	// It only works for 1 level of non-existence
	const lastPathElementDoesNotExist = !hasIn && hasInParent
	const newNodeSrc = lastPathElementDoesNotExist
		? {
				[`${toPath(path).pop()}`]: definition,
		  }
		: definition

	const pathToUpdate = lastPathElementDoesNotExist ? parentPath : pathArray
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

const moveDef = (state: MetadataState, payload: MoveDefinitionPayload) => {
	const isArrayMove = isNumberIndex(getKeyAtPath(payload.toPath))

	if (!isArrayMove) {
		const fromPathStr = payload.fromPath
		const toPathStr = payload.toPath

		const fromParentPath = getParentPath(payload.fromPath)
		const toParentPath = getParentPath(payload.toPath)

		if (fromParentPath !== toParentPath) return

		const fromKey = getKeyAtPath(fromPathStr)
		const toKey = getKeyAtPath(toPathStr)

		const fromPathArray = toPath(fromParentPath)

		const yamlDoc = parse(state.content)
		const defNode = getNodeAtPath(fromPathArray, yamlDoc.contents)
		const definition = defNode?.toJSON() as DefinitionMap

		if (!definition || !fromKey || !toKey) return

		const keys = Object.keys(definition)
		const fromIndex = keys.indexOf(fromKey)
		const toIndex = keys.indexOf(toKey)

		const newKeys = keys.map((el, i) => {
			if (i === fromIndex) return keys[toIndex]
			if (i === toIndex) return keys[fromIndex]
			return el
		})

		const newDefinition = newKeys.reduce(
			(obj, item) => ({
				...obj,
				[item]: definition[item],
			}),
			{}
		)

		return setDef(state, {
			path: fromParentPath,
			definition: newDefinition,
		})
	}

	const fromPathStr = payload.fromPath
	const fromPathArray = toPath(fromPathStr)
	//fromPathArray.splice(-1)
	//Grab current definition
	const yamlDoc = parse(state.content)
	const defNode = getNodeAtPath(fromPathArray, yamlDoc.contents)
	const definition = defNode?.toJSON() as DefinitionMap
	//Remove the original
	removeDef(state, { path: fromPathStr })
	const toPathStr = payload.toPath
	const pathArray = toPath(toPathStr)
	const index = parseInt(pathArray[pathArray.length - 1], 10)

	const updatedPathStr = payload.toPath
	const updatePathArr = toPath(updatedPathStr)
	updatePathArr.splice(-1)
	//Add back in the intended spot

	addDef(state, {
		definition,
		index,
		path: fromPath(updatePathArr),
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
	const oldKey = pathArray.pop()

	if (oldKey) {
		if (state.content) {
			// create a new document so components using useYaml will rerender
			const yamlDoc = parse(state.content)
			const parent = getNodeAtPath(
				pathArray,
				yamlDoc.contents
			) as yaml.YAMLMap
			const keyNode = parent?.items.find(
				(item) => yaml.isScalar(item.key) && item.key.value === oldKey
			)
			if (keyNode && yaml.isScalar(keyNode.key)) {
				keyNode.key.value = newKey
			}
			state.content = yamlDoc.toString()
			state.parsed = yamlDoc.toJSON()
		}
	}
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
