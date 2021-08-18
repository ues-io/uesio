import { createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit"
import setWith from "lodash/setWith"
import toPath from "lodash/toPath"
import { Definition, DefinitionMap, YamlDoc } from "../../definition/definition"
import yaml from "yaml"
import {
	addNodeAtPath,
	addNodePairAtPath,
	getNodeAtPath,
	removeNodeAtPath,
	setNodeAtPath,
	newDoc,
	parse,
	parseDocument,
} from "../../yamlutils/yamlutils"
import get from "lodash/get"
import { EntityPayload } from "../utils"
// import type { Collection } from "yaml/types"
import { PlainViewDef } from "./types"
import loadOp from "./operations/load"
import builderOps from "../builder/operations"
import viewdefAdapter from "./adapter"
import {
	calculateNewPathAheadOfTime,
	fromPath,
	getFullPathParts,
} from "../../component/path"
import {
	setDefinition,
	addDefinition,
	addDefinitionPair,
	removeDefinition,
	changeDefinitionKey,
	moveDefinition,
	setYaml,
	cancel,
} from "../builder"

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

const updateYaml = (state: PlainViewDef, payload: YamlUpdatePayload) => {
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
	setNodeAtPath(path, state.yaml, yamlDoc)
}

const setDef = (state: PlainViewDef, payload: SetDefinitionPayload) => {
	const { path, definition } = payload
	const pathArray = toPath(path)
	// Set the definition JS Object
	setWith(state, ["definition", ...pathArray], definition)
	if (state.yaml) {
		// create a new document so components using useYaml will rerender
		const doc = new yaml.Document(state.yaml.toJSON())
		doc.setIn(pathArray, definition)
		state.yaml = doc
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
			state.yaml = new yaml.Document(state.yaml.toJSON())
			removeNodeAtPath(pathArray.concat([index]), state.yaml.contents)
		}
	}
}

const moveDef = (state: PlainViewDef, payload: MoveDefinitionPayload) => {
	const fromPathStr = payload.fromPath
	const fromPathArray = toPath(fromPathStr)
	fromPathArray.splice(-1)
	//Grab current definition
	const definition = get(state.definition, fromPathArray)
	//Remove the original
	removeDef(state, { ...payload, path: fromPathStr })
	const toPathStr = payload.toPath
	const pathArray = toPath(toPathStr)
	const index = parseInt(pathArray[pathArray.length - 2], 10)
	const updatedPathStr = calculateNewPathAheadOfTime(
		payload.fromPath,
		payload.toPath
	)
	const updatePathArr = toPath(updatedPathStr)
	updatePathArr.splice(-2)
	//Add back in the intended spot
	addDef(state, {
		...payload,
		definition,
		index,
		path: fromPath(updatePathArr),
	})
}

const addDef = (state: PlainViewDef, payload: AddDefinitionPayload) => {
	const { path, definition, index } = payload
	const pathArray = toPath(path)
	const currentArray = get(state.definition, path)

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
		state.yaml = new yaml.Document(state.yaml.toJSON())
		const doc = new yaml.Document()
		const node = doc.createNode(definition)
		if (node) {
			addNodeAtPath(path, state.yaml, node, newIndex)
		}
	}
}

const addDefPair = (state: PlainViewDef, payload: AddDefinitionPairPayload) => {
	const { path, definition, key } = payload
	const pathArray = toPath(path)

	setWith(state, ["definition", ...pathArray, key], definition)

	if (state.yaml) {
		// create a new document so components using useYaml will rerender
		state.yaml = new yaml.Document(state.yaml.toJSON())
		const newNode = state.yaml.createNode(definition, true)

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

		setWith(state, ["definition", ...pathArray], newParent)
		if (state.yaml) {
			// create a new document so components using useYaml will rerender
			state.yaml = new yaml.Document(state.yaml.toJSON())

			const parent = getNodeAtPath(pathArray, state.yaml) as yaml.YAMLMap

			const keyNode: any = parent?.items.find(
				(item: any) => item.key === oldKey
			)

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
		cancel: cancelAllDefs,
	},

	extraReducers: (builder) => {
		builder.addCase(
			loadOp.fulfilled,
			(state, { payload }: PayloadAction<string>) => {
				const doc = parseDocument(payload)
				const { namespace, name, dependencies, definition } =
					doc.toJSON()
				const yaml = newDoc(definition)

				viewdefAdapter.upsertOne(state, {
					namespace,
					name,
					dependencies,
					yaml,
					originalYaml: doc,
					definition,
				})
			}
		)
		builder.addCase(builderOps.save.fulfilled, saveAllDefs)
		builder.addCase(
			setDefinition,
			(state, { payload }: PayloadAction<SetDefinitionPayload>) => {
				const [metadataType, metadataItem, localPath] =
					getFullPathParts(payload.path)
				if (metadataType === "viewdef") {
					const entityState = state.entities[metadataItem]
					entityState &&
						setDef(entityState, {
							path: localPath,
							definition: payload.definition,
							entity: metadataItem,
						})
				}
			}
		)
		builder.addCase(
			addDefinition,
			(state, { payload }: PayloadAction<AddDefinitionPayload>) => {
				const [metadataType, metadataItem, localPath] =
					getFullPathParts(payload.path)
				if (metadataType === "viewdef") {
					const entityState = state.entities[metadataItem]
					entityState &&
						addDef(entityState, {
							path: localPath,
							definition: payload.definition,
							entity: metadataItem,
							index: payload.index,
						})
				}
			}
		)
		builder.addCase(
			addDefinitionPair,
			(state, { payload }: PayloadAction<AddDefinitionPairPayload>) => {
				const [metadataType, metadataItem, localPath] =
					getFullPathParts(payload.path)
				if (metadataType === "viewdef") {
					const entityState = state.entities[metadataItem]
					entityState &&
						addDefPair(entityState, {
							path: localPath,
							definition: payload.definition,
							entity: metadataItem,
							key: payload.key,
						})
				}
			}
		)
		builder.addCase(
			removeDefinition,
			(state, { payload }: PayloadAction<RemoveDefinitionPayload>) => {
				const [metadataType, metadataItem, localPath] =
					getFullPathParts(payload.path)
				if (metadataType === "viewdef") {
					const entityState = state.entities[metadataItem]
					entityState &&
						removeDef(entityState, {
							path: localPath,
							entity: metadataItem,
						})
				}
			}
		)
		builder.addCase(
			changeDefinitionKey,
			(state, { payload }: PayloadAction<ChangeDefinitionKeyPayload>) => {
				const [metadataType, metadataItem, localPath] =
					getFullPathParts(payload.path)
				if (metadataType === "viewdef") {
					const entityState = state.entities[metadataItem]
					entityState &&
						changeDefKey(entityState, {
							path: localPath,
							entity: metadataItem,
							key: payload.key,
						})
				}
			}
		)
		builder.addCase(
			moveDefinition,
			(state, { payload }: PayloadAction<MoveDefinitionPayload>) => {
				const [toType, toItem, toPath] = getFullPathParts(
					payload.toPath
				)
				const [fromType, fromItem, fromPath] = getFullPathParts(
					payload.fromPath
				)
				if (
					toType === "viewdef" &&
					fromType === "viewdef" &&
					toItem === fromItem
				) {
					const entityState = state.entities[toItem]
					entityState &&
						moveDef(entityState, {
							fromPath,
							entity: toItem,
							toPath,
						})
				}
			}
		)
		builder.addCase(
			setYaml,
			(state, { payload }: PayloadAction<YamlUpdatePayload>) => {
				const [metadataType, metadataItem, localPath] =
					getFullPathParts(payload.path)
				if (metadataType === "viewdef") {
					const entityState = state.entities[metadataItem]
					entityState &&
						updateYaml(entityState, {
							path: localPath,
							yaml: payload.yaml,
							entity: metadataItem,
						})
				}
			}
		)
		builder.addCase(cancel, cancelAllDefs)
	},
})

export default viewDefSlice.reducer
