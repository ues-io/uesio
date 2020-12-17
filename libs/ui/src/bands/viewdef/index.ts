import { createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit"
import setWith from "lodash.setwith"
import toPath from "lodash.topath"
import {
	Definition,
	DefinitionList,
	DefinitionMap,
	YamlDoc,
} from "../../definition/definition"
import yaml from "yaml"
import {
	addNodeAtPath,
	addNodePairAtPath,
	getNodeAtPath,
	removeNodeAtPath,
	setNodeAtPath,
	YAML_OPTIONS,
} from "../../yamlutils/yamlutils"
import get from "lodash.get"
import { createEntityReducer, EntityPayload } from "../utils"
import { Collection } from "yaml/types"
import { getParentPath } from "../../component/path"
import { PlainViewDef } from "./types"
import loadOp from "./operations/load"
import saveOp from "./operations/save"
import viewdefAdapter from "./adapter"

type YamlUpdatePayload = {
	path: string
	yaml: YamlDoc
} & EntityPayload

type RemoveDefinitionPayload = {
	path: string
} & EntityPayload

type SetDefinitionPayload = {
	path: string
	definition: Definition
} & EntityPayload

type MoveDefinitionPayload = {
	fromPath: string
	toPath: string
} & EntityPayload

type AddDefinitionPayload = {
	path: string
	definition: Definition
	index?: number
} & EntityPayload

type AddDefinitionPairPayload = {
	path: string
	definition: Definition
	key: string
} & EntityPayload

type ChangeDefinitionKeyPayload = {
	path: string
	key: string
} & EntityPayload

const move = (
	fromList: DefinitionList,
	toList: DefinitionList,
	fromIndex: number,
	toIndex: number
) => {
	const [removed] = fromList.splice(fromIndex, 1)
	toList.splice(toIndex, 0, removed)
}

const updateYaml = (state: PlainViewDef, payload: YamlUpdatePayload) => {
	const { path, yaml: yamlDoc } = payload
	const pathArray = toPath(path)
	const definition = yamlDoc.toJSON()

	// Set the definition JS Object from the yaml
	setWith(state, ["definition"].concat(pathArray), definition)

	if (!state.originalYaml) {
		state.originalYaml = yamlDoc
	}

	if (!state.yaml) {
		state.yaml = yamlDoc
		return
	}

	if (state.yaml === state.originalYaml) {
		state.originalYaml = yaml.parseDocument(
			state.originalYaml.toString(),
			YAML_OPTIONS
		)
	}

	// We actually don't want components using useYaml to rerender
	setNodeAtPath(path, state.yaml.contents, yamlDoc.contents)
}

const setDef = (state: PlainViewDef, payload: SetDefinitionPayload) => {
	const { path, definition } = payload
	const pathArray = toPath(path)

	// Set the definition JS Object
	setWith(state, ["definition"].concat(pathArray), definition)

	if (state.yaml) {
		// create a new document so components using useYaml will rerender
		state.yaml = yaml.parseDocument(state.yaml.toString(), YAML_OPTIONS)
		const newNode = definition ? yaml.createNode(definition) : null
		setNodeAtPath(path, state.yaml.contents, newNode)
	}
}

const removeDef = (state: PlainViewDef, payload: RemoveDefinitionPayload) => {
	const pathArray = toPath(payload.path)
	if (pathArray.length > 0 && pathArray[0] === "components") {
		pathArray.pop() // Remove the component name
	}
	const index = pathArray.pop() // Get the index
	const parent = get(state.definition, pathArray)
	if (index) {
		const newParent = Array.isArray(parent)
			? parent.filter(
					(item: Definition, itemIndex: number) =>
						parseInt(index, 10) !== itemIndex
			  )
			: delete parent[index]
		if (state.definition) {
			setWith(state, ["definition"].concat(pathArray), newParent)
		}
		if (state.yaml) {
			// create a new document so components using useYaml will rerender
			state.yaml = yaml.parseDocument(state.yaml.toString(), YAML_OPTIONS)
			removeNodeAtPath(pathArray.concat([index]), state.yaml.contents)
		}
	}
}

const moveDef = (state: PlainViewDef, payload: MoveDefinitionPayload) => {
	const { fromPath, toPath: destPath } = payload
	// Traverse paths simultaneously until paths diverge.
	const fromPathArr = toPath(fromPath)
	const toPathArr = toPath(destPath)
	const fromIndex = fromPathArr.pop()
	const toIndex = toPathArr.pop()

	if (fromIndex && toIndex) {
		const fromParent = get(state.definition, fromPathArr)
		const toParent = get(state.definition, toPathArr)

		move(
			fromParent,
			toParent,
			parseInt(fromIndex, 10),
			parseInt(toIndex, 10)
		)

		const destParentPath = getParentPath(destPath)
		const fromParentPath = getParentPath(fromPath)

		// Now set both parents so they can trigger redux
		// Set the definition JS Object
		if (
			!fromParentPath.startsWith(destParentPath) ||
			toParent === fromParent
		) {
			setWith(state, ["definition"].concat(fromPathArr), fromParent)
		}
		if (toParent !== fromParent) {
			if (!destParentPath.startsWith(fromParentPath)) {
				setWith(state, ["definition"].concat(toPathArr), toParent)
			}
		}

		if (state.yaml) {
			// create a new document so components using useYaml will rerender
			state.yaml = yaml.parseDocument(state.yaml.toString(), YAML_OPTIONS)
			const fromYamlParent = getNodeAtPath(
				fromPathArr,
				state.yaml.contents
			)
			const toYamlParent = getNodeAtPath(toPathArr, state.yaml.contents)

			const item = getNodeAtPath(
				[fromIndex],
				fromYamlParent
			) as yaml.AST.BlockMap
			removeNodeAtPath([fromIndex], fromYamlParent)
			// This is kind of a hack. But the yaml library doesn't have an
			// "add at index" method.
			;(toYamlParent as Collection).items.splice(
				parseInt(toIndex, 10),
				0,
				item
			)
		}
	}
}

const addDef = (state: PlainViewDef, payload: AddDefinitionPayload) => {
	const { path, definition } = payload
	const pathArray = toPath(path)
	const currentArray = get(state.definition, path) || []

	const newIndex = payload.index || currentArray.length
	currentArray.splice(newIndex, 0, definition)
	setWith(state, ["definition"].concat(pathArray), currentArray)

	if (state.yaml && definition) {
		// create a new document so components using useYaml will rerender
		state.yaml = yaml.parseDocument(state.yaml.toString(), YAML_OPTIONS)
		const newNode = yaml.createNode(definition, true)
		if (newNode) {
			addNodeAtPath(path, state.yaml.contents, newNode, newIndex)
		}
	}
}

const addDefPair = (state: PlainViewDef, payload: AddDefinitionPairPayload) => {
	const { path, definition, key } = payload
	const pathArray = toPath(path)

	setWith(state, ["definition"].concat(pathArray).concat(key), definition)

	if (state.yaml) {
		// create a new document so components using useYaml will rerender
		state.yaml = yaml.parseDocument(state.yaml.toString(), YAML_OPTIONS)
		const newNode = yaml.createNode(definition, true)
		addNodePairAtPath(path, state.yaml.contents, newNode, key)
	}
}

const changeDefKey = (
	state: PlainViewDef,
	payload: ChangeDefinitionKeyPayload
) => {
	const { path, key: newKey } = payload
	const pathArray = toPath(path)
	const oldKey = pathArray.pop()

	if (oldKey) {
		const parent = get(state.definition, pathArray)
		const newParent: DefinitionMap = Object.keys(parent).reduce(
			(acc, key) => ({
				...acc,
				...(key === oldKey
					? { [newKey]: parent[oldKey] }
					: { [key]: parent[key] }),
			}),
			{}
		)

		setWith(state, ["definition"].concat(pathArray), newParent)
		if (state.yaml) {
			// create a new document so components using useYaml will rerender
			state.yaml = yaml.parseDocument(state.yaml.toString(), YAML_OPTIONS)
			const parent = getNodeAtPath(
				pathArray,
				state.yaml.contents
			) as Collection
			const keyNode = parent?.items.find((item) => {
				return item.key.value === oldKey
			})

			keyNode.key.value = newKey
		}
	}
}

const saveAllDefs = (state: EntityState<PlainViewDef>) => {
	const viewdefs = state.entities
	for (const defKey of Object.keys(viewdefs)) {
		const defState = viewdefs[defKey]

		if (!defState) continue
		const yamlDoc = defState.yaml
		const originalYamlDoc = defState.originalYaml
		if (yamlDoc === originalYamlDoc) continue
		if (!yamlDoc) continue

		delete defState.originalYaml
		delete defState.yaml

		updateYaml(defState, {
			entity: defKey,
			path: "",
			yaml: yamlDoc,
		})
	}
}

const cancelAllDefs = (state: EntityState<PlainViewDef>) => {
	const viewdefs = state.entities
	for (const defKey of Object.keys(viewdefs)) {
		const defState = viewdefs[defKey]

		if (!defState) continue
		const yamlDoc = defState.yaml
		const originalYamlDoc = defState.originalYaml
		if (yamlDoc === originalYamlDoc) continue
		if (!originalYamlDoc) continue

		delete defState.originalYaml
		delete defState.yaml

		updateYaml(defState, {
			entity: defKey,
			path: "",
			yaml: originalYamlDoc,
		})
	}
}

const viewDefSlice = createSlice({
	name: "viewdef",
	initialState: viewdefAdapter.getInitialState(),
	reducers: {
		setYaml: createEntityReducer<YamlUpdatePayload, PlainViewDef>(
			updateYaml
		),
		setDefinition: createEntityReducer<SetDefinitionPayload, PlainViewDef>(
			setDef
		),
		removeDefinition: createEntityReducer<
			RemoveDefinitionPayload,
			PlainViewDef
		>(removeDef),
		moveDefinition: createEntityReducer<
			MoveDefinitionPayload,
			PlainViewDef
		>(moveDef),
		addDefinition: createEntityReducer<AddDefinitionPayload, PlainViewDef>(
			addDef
		),
		addDefinitionPair: createEntityReducer<
			AddDefinitionPairPayload,
			PlainViewDef
		>(addDefPair),
		changeDefinitionKey: createEntityReducer<
			ChangeDefinitionKeyPayload,
			PlainViewDef
		>(changeDefKey),
		cancel: cancelAllDefs,
	},
	extraReducers: (builder) => {
		builder.addCase(
			loadOp.fulfilled,
			(state, { payload }: PayloadAction<string>) => {
				const yamlDoc = yaml.parseDocument(payload, YAML_OPTIONS)
				const defDoc = new yaml.Document(YAML_OPTIONS)
				defDoc.contents = getNodeAtPath("definition", yamlDoc.contents)
				const dependenciesDoc = getNodeAtPath(
					"dependencies",
					yamlDoc.contents
				)

				viewdefAdapter.upsertOne(state, {
					namespace: yamlDoc.get("namespace"),
					name: yamlDoc.get("name"),
					dependencies: dependenciesDoc?.toJSON(),
					yaml: defDoc,
					originalYaml: defDoc,
					definition: defDoc.toJSON(),
				})
			}
		)
		builder.addCase(saveOp.fulfilled, saveAllDefs)
	},
})

export const {
	cancel,
	setYaml,
	removeDefinition,
	setDefinition,
	moveDefinition,
	addDefinition,
	addDefinitionPair,
	changeDefinitionKey,
} = viewDefSlice.actions

export default viewDefSlice.reducer
