import toPath from "lodash/toPath"
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
import { Definition, DefinitionMap, YamlDoc } from "../definition/definition"

import {
	addNodeAtPath,
	addNodePairAtPath,
	getNodeAtPath,
	parse,
	removeNodeAtPath,
	setNodeAtPath,
} from "../yamlutils/yamlutils"
import { MetadataState } from "../bands/metadata/types"
import { isScalar, YAMLMap } from "yaml"

const getNewNode = (yaml: YamlDoc, definition: Definition) => {
	//Keep this line on top; 0 is false in JS, but we want to write it to YAML
	if (definition === 0) {
		return yaml.createNode(definition)
	}

	if (!definition) {
		return null
	}

	return yaml.createNode(definition)
}

const setDef = (state: MetadataState, payload: SetDefinitionPayload) => {
	const { path, definition } = payload

	if (state.content) {
		// create a new document so components using useYaml will rerender
		const yamlDoc = parse(state.content)
		const newNode = getNewNode(yamlDoc, definition)
		const pathArray = toPath(path)
		setNodeAtPath(
			["definition"].concat(pathArray),
			yamlDoc.contents,
			newNode
		)
		state.content = yamlDoc.toString()
		state.parsed = yamlDoc.toJSON()
	}
}

const addDef = (state: MetadataState, payload: AddDefinitionPayload) => {
	const { path, definition, index } = payload

	if (state.content && definition) {
		const yamlDoc = parse(state.content)
		const newNode = yamlDoc.createNode(definition)
		const pathArray = toPath(path)
		if (newNode) {
			addNodeAtPath(
				["definition"].concat(pathArray),
				yamlDoc.contents,
				newNode,
				index || 0
			)
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
		removeNodeAtPath(
			["definition"].concat(pathArray, [index]),
			yamlDoc.contents
		)
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
		const defNode = getNodeAtPath(
			["definition"].concat(fromPathArray),
			yamlDoc.contents
		)
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
	const defNode = getNodeAtPath(
		["definition"].concat(fromPathArray),
		yamlDoc.contents
	)
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

		addNodePairAtPath(
			["definition"].concat(toPath(path)),
			yamlDoc.contents,
			newNode,
			key
		)

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
		const defNode = getNodeAtPath(
			["definition"].concat(toPath(parentPath)),
			yamlDoc.contents
		)
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
		const defNode = getNodeAtPath(
			["definition"].concat(toPath(path)),
			yamlDoc.contents
		)
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
				["definition"].concat(pathArray),
				yamlDoc.contents
			) as YAMLMap
			const keyNode = parent?.items.find(
				(item) => isScalar(item.key) && item.key.value === oldKey
			)
			if (keyNode && isScalar(keyNode.key)) {
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
