import get from "lodash/get"
import setWith from "lodash/setWith"
import toPath from "lodash/toPath"
import {
	AddDefinitionPayload,
	MoveDefinitionPayload,
	RemoveDefinitionPayload,
	SetDefinitionPayload,
	YamlUpdatePayload,
} from "../bands/builder"
import {
	isNumberIndex,
	getKeyAtPath,
	getParentPath,
	fromPath,
} from "../component/path"
import { Definition, DefinitionMap, YamlDoc } from "../definition/definition"
import yaml from "yaml"
import {
	addNodeAtPath,
	parse,
	removeNodeAtPath,
	setNodeAtPath,
} from "../yamlutils/yamlutils"

export type CommonState = {
	definition: DefinitionMap
	yaml?: YamlDoc
	originalYaml?: YamlDoc | undefined
}

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

const setDef = (state: CommonState, payload: SetDefinitionPayload) => {
	const { path, definition } = payload
	const pathArray = toPath(path)

	// Set the definition JS Object
	setWith(state, ["definition", ...pathArray], definition)
	if (state.yaml) {
		// create a new document so components using useYaml will rerender
		state.yaml = parse(state.yaml.toString())
		const newNode = getNewNode(state.yaml, definition)
		setNodeAtPath(path, state.yaml.contents, newNode)
	}
}

const addDef = (state: CommonState, payload: AddDefinitionPayload) => {
	const { path, definition, index } = payload
	const pathArray = toPath(path)
	const currentArray = get(state.definition, path) as Definition[]
	let newIndex: number
	if (!currentArray) {
		newIndex = 0
		setWith(state, ["definition", ...pathArray], [definition])
	} else {
		newIndex = index === undefined ? currentArray.length : index
		currentArray.splice(newIndex, 0, definition)
	}
	if (state.yaml && definition) {
		// create a new document so components using useYaml will rerender
		state.yaml = parse(state.yaml.toString())
		const newNode = state.yaml.createNode(definition)
		if (newNode) {
			addNodeAtPath(path, state.yaml.contents, newNode, newIndex)
		}
	}
}

const removeDef = (state: CommonState, payload: RemoveDefinitionPayload) => {
	const pathArray = toPath(payload.path)
	const index = pathArray.pop() // Get the index
	const parent = get(state.definition, pathArray)
	if (index) {
		if (Array.isArray(parent)) {
			const newParent = parent.filter(
				(item: Definition, itemIndex: number) =>
					parseInt(index, 10) !== itemIndex
			)
			if (state.definition) {
				setWith(state, ["definition", ...pathArray], newParent)
			}
		} else {
			delete parent[index]
			if (state.definition) {
				setWith(state, ["definition", ...pathArray], parent)
			}
		}

		if (state.yaml) {
			// create a new document so components using useYaml will rerender
			state.yaml = parse(state.yaml.toString())
			removeNodeAtPath(pathArray.concat([index]), state.yaml.contents)
		}
	}
}

const moveDef = (state: CommonState, payload: MoveDefinitionPayload) => {
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
			state.definition,
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
	const definition = get(state.definition, fromPathArray)
	//Remove the original
	removeDef(state, { path: fromPathStr })
	const toPathStr = payload.toPath
	const pathArray = toPath(toPathStr)
	const index = parseInt(pathArray[pathArray.length - 1], 10)
	/*
	const updatedPathStr = calculateNewPathAheadOfTime(
		payload.fromPath,
		payload.toPath
	)
	*/
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

const updateYaml = (state: CommonState, payload: YamlUpdatePayload) => {
	const { path, yaml: yamlDoc } = payload
	const pathArray = toPath(path)
	const definition = yamlDoc.toJSON()

	// Set the definition JS Object from the yaml
	setWith(state, ["definition", ...pathArray], definition)
	if (!state.originalYaml) {
		state.originalYaml = yamlDoc
	}

	if (!state.yaml) {
		state.yaml = yamlDoc
		return
	}

	if (state.yaml === state.originalYaml) {
		state.originalYaml = parse(state.originalYaml.toString())
	}
	if (!path) return (state.yaml = new yaml.Document(state.yaml.toJSON()))

	// We actually don't want components using useYaml to rerender
	setNodeAtPath(path, state.yaml.contents, yamlDoc.contents)
}

export { removeDef, addDef, moveDef, setDef, updateYaml }
