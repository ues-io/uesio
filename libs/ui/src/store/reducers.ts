import get from "lodash/get"

import toPath from "lodash/toPath"
import {
	AddDefinitionPayload,
	MoveDefinitionPayload,
	RemoveDefinitionPayload,
	SetDefinitionPayload,
} from "../bands/builder"
import {
	isNumberIndex,
	getKeyAtPath,
	getParentPath,
	fromPath,
} from "../component/path"
import { Definition, DefinitionMap, YamlDoc } from "../definition/definition"

import {
	addNodeAtPath,
	parse,
	removeNodeAtPath,
	setNodeAtPath,
} from "../yamlutils/yamlutils"
import { MetadataState } from "../bands/metadata/types"

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

		const definition = get(
			(state.parsed as DefinitionMap).definition,
			fromParentPath
		) as DefinitionMap

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
	const definition = get(
		(state.parsed as DefinitionMap).definition,
		fromPathArray
	)
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

export { removeDef, addDef, setDef, moveDef }
