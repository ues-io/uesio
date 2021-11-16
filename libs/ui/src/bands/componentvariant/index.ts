import { createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit"
import setWith from "lodash/setWith"
import toPath from "lodash/toPath"
import { DefinitionMap } from "../../definition/definition"
import yaml from "yaml"
import {
	addNodePairAtPath,
	getNodeAtPath,
	setNodeAtPath,
	newDoc,
	parse,
} from "../../yamlutils/yamlutils"
import get from "lodash/get"
import { ComponentVariant } from "./types"
import loadOp from "../viewdef/operations/load"
import builderOps from "../builder/operations"
import componenetVariantDefAdapter from "./adapter"
import {
	getFullPathParts,
	getIndexFromPath,
	getKeyAtPath,
	getParentPath,
	isNumberIndex,
	parseVariantKey,
} from "../../component/path"
import {
	setDefinition,
	addDefinition,
	addDefinitionPair,
	removeDefinition,
	changeDefinitionKey,
	moveDefinition,
	cloneDefinition,
	setYaml,
	cancel,
	CloneDefinitionPayload,
	YamlUpdatePayload,
	SetDefinitionPayload,
	RemoveDefinitionPayload,
	MoveDefinitionPayload,
	AddDefinitionPayload,
	AddDefinitionPairPayload,
	ChangeDefinitionKeyPayload,
} from "../builder"
import { removeDef, addDef, setDef, moveDef } from "./reducers"

const updateYaml = (state: ComponentVariant, payload: YamlUpdatePayload) => {
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

	console.log({ path, state, yamlDoc })

	setNodeAtPath(path, state.yaml.contents, yamlDoc.contents)
}

/**
 * Clone a yaml node. Currently only tested with componentvariant components.
 * We might want to extend the functionality to themes and variants.
 *  * @param path - path of the cloned component, the new component will be a direct sibling
 */
const cloneDef = (
	state: ComponentVariant,
	{ path }: CloneDefinitionPayload
) => {
	const parentPath = getParentPath(path)
	const isArrayClone = isNumberIndex(getKeyAtPath(parentPath))
	if (isArrayClone) {
		const index = getIndexFromPath(parentPath)
		if (!index && index !== 0) return
		addDef(state, {
			path: getParentPath(parentPath),
			definition: get(state.definition, toPath(parentPath)),
			index: index + 1,
		})
	} else {
		const newKey =
			(getKeyAtPath(path) || "") + (Math.floor(Math.random() * 60) + 1)

		addDefPair(state, {
			path: parentPath,
			definition: get(state.definition, toPath(path)),
			key: newKey,
		})
	}
}

const addDefPair = (
	state: ComponentVariant,
	payload: AddDefinitionPairPayload
) => {
	const { path, definition, key } = payload
	const pathArray = toPath(path)

	setWith(state, ["definition", ...pathArray, key], definition)

	if (state.yaml) {
		// create a new document so components using useYaml will rerender
		state.yaml = parse(state.yaml.toString())
		const newNode = state.yaml.createNode(definition)

		addNodePairAtPath(path, state.yaml.contents, newNode, key)
	}
}

const changeDefKey = (
	state: ComponentVariant,
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
			state.yaml = parse(state.yaml.toString())

			const parent = getNodeAtPath(
				pathArray,
				state.yaml.contents
			) as yaml.YAMLMap

			const keyNode = parent?.items.find(
				(item) => yaml.isScalar(item.key) && item.key.value === oldKey
			)

			if (keyNode && yaml.isScalar(keyNode.key)) {
				keyNode.key.value = newKey
			}
		}
	}
}

const saveAllDefs = (state: EntityState<ComponentVariant>) => {
	const componentvariants = state.entities
	for (const defKey of Object.keys(componentvariants)) {
		const defState = componentvariants[defKey]

		if (!defState) continue
		const yamlDoc = defState.yaml
		const originalYamlDoc = defState.originalYaml
		if (yamlDoc === originalYamlDoc) continue
		if (!yamlDoc) continue

		delete defState.originalYaml
		delete defState.yaml

		updateYaml(defState, {
			path: "",
			yaml: yamlDoc,
		})
	}
}

const cancelAllDefs = (state: EntityState<ComponentVariant>) => {
	const componentvariants = state.entities
	for (const defKey of Object.keys(componentvariants)) {
		const defState = componentvariants[defKey]

		if (!defState) continue
		const yamlDoc = defState.yaml
		const originalYamlDoc = defState.originalYaml
		if (yamlDoc === originalYamlDoc) continue
		if (!originalYamlDoc) continue

		delete defState.originalYaml
		delete defState.yaml

		updateYaml(defState, {
			path: "",
			yaml: originalYamlDoc,
		})
	}
}

const ComponentVariantSlice = createSlice({
	name: "componentvariant",
	initialState: componenetVariantDefAdapter.getInitialState(),
	reducers: {
		cancel: cancelAllDefs,
	},

	extraReducers: (builder) => {
		//TO-DO when de viewdef is load we add the componenetVariantDef to the store
		builder.addCase(
			loadOp.fulfilled,
			(state, { payload }: PayloadAction<string>) => {
				const yamlDoc = parse(payload)
				const variants = getNodeAtPath(
					["dependencies", "componentvariants"],
					yamlDoc.contents
				)?.toJSON()
				if (variants) {
					Object.keys(variants).forEach((key) => {
						if (state.entities[key]) return
						const defDoc = newDoc()
						defDoc.contents = variants[key].definition

						const [
							componentNamespace,
							compnentName,
							variantNamespace,
						] = parseVariantKey(key)

						componenetVariantDefAdapter.upsertOne(state, {
							name: key,
							namespace: variantNamespace,
							yaml: defDoc,
							originalYaml: defDoc,
							definition: defDoc.toJSON(),
							component: `${componentNamespace}.${compnentName}`,
							label: key, //TO-DO GET the label
						})
					})
				}
			}
		)
		builder.addCase(builderOps.save.fulfilled, saveAllDefs)
		builder.addCase(
			setDefinition,
			(state, { payload }: PayloadAction<SetDefinitionPayload>) => {
				const [metadataType, metadataItem, localPath] =
					getFullPathParts(payload.path)

				if (metadataType === "componentvariant") {
					const entityState = state.entities[metadataItem]

					entityState &&
						setDef(entityState, {
							path: localPath,
							definition: payload.definition,
						})
					// addDef(entityState, {
					// 	path: localPath,
					// 	definition: payload.definition,
					// })
				}
			}
		)
		builder.addCase(
			cloneDefinition,
			(state, { payload }: PayloadAction<CloneDefinitionPayload>) => {
				const [metadataType, metadataItem, localPath] =
					getFullPathParts(payload.path)
				if (metadataType === "componentvariant") {
					const entityState = state.entities[metadataItem]
					entityState &&
						cloneDef(entityState, {
							path: localPath,
						})
				}
			}
		)
		builder.addCase(
			addDefinition,
			(state, { payload }: PayloadAction<AddDefinitionPayload>) => {
				const [metadataType, metadataItem, localPath] =
					getFullPathParts(payload.path)
				if (metadataType === "componentvariant") {
					const entityState = state.entities[metadataItem]
					entityState &&
						addDef(entityState, {
							path: localPath,
							definition: payload.definition,
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
				if (metadataType === "componentvariant") {
					const entityState = state.entities[metadataItem]
					entityState &&
						addDefPair(entityState, {
							path: localPath,
							definition: payload.definition,
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
				if (metadataType === "componentvariant") {
					const entityState = state.entities[metadataItem]
					entityState &&
						removeDef(entityState, {
							path: localPath,
						})
				}
			}
		)
		builder.addCase(
			changeDefinitionKey,
			(state, { payload }: PayloadAction<ChangeDefinitionKeyPayload>) => {
				const [metadataType, metadataItem, localPath] =
					getFullPathParts(payload.path)
				if (metadataType === "componentvariant") {
					const entityState = state.entities[metadataItem]
					entityState &&
						changeDefKey(entityState, {
							path: localPath,
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
					toType === "componentvariant" &&
					fromType === "componentvariant" &&
					toItem === fromItem
				) {
					const entityState = state.entities[toItem]
					entityState &&
						moveDef(entityState, {
							fromPath,
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

				console.log("SET YAML CV", {
					metadataType,
					metadataItem,
					localPath,
				})
				if (metadataType === "componentvariant") {
					const entityState = state.entities[metadataItem]
					entityState &&
						updateYaml(entityState, {
							path: localPath,
							yaml: payload.yaml,
						})
				}
			}
		)
		builder.addCase(cancel, cancelAllDefs)
	},
})

export default ComponentVariantSlice.reducer
