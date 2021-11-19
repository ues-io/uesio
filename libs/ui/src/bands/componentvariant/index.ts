import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import loadOp from "../viewdef/operations/load"
import {
	getNodeAtPath,
	newDoc,
	parse,
	setNodeAtPath,
} from "../../yamlutils/yamlutils"
import componentVariantAdapter from "./adapter"
import { getFullPathParts, parseVariantKey, toPath } from "../../component/path"
import { ComponentVariant } from "./types"
import yaml, { Scalar, YAMLMap } from "yaml"
import {
	addDefinition,
	AddDefinitionPayload,
	moveDefinition,
	MoveDefinitionPayload,
	removeDefinition,
	RemoveDefinitionPayload,
	setDefinition,
	SetDefinitionPayload,
	setYaml,
	YamlUpdatePayload,
} from "../builder"
import { addDef, moveDef, removeDef, setDef } from "./reducers"
import { setWith } from "lodash"

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
	setNodeAtPath(path, state.yaml.contents, yamlDoc.contents)
}

const componentVariantSlice = createSlice({
	name: "componentVariant",
	initialState: componentVariantAdapter.getInitialState(),
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(loadOp.fulfilled, (state, { payload }) => {
			const yamlDoc = parse(payload)
			const variants = getNodeAtPath(
				["dependencies", "componentvariants"],
				yamlDoc.contents
			) as YAMLMap<Scalar<string>, YAMLMap>

			if (variants) {
				const variantsToAdd: Record<string, ComponentVariant> = {}
				variants.items.forEach((item) => {
					const key = item.key.value
					if (state.entities[key]) return
					const [, , variantNamespace] = parseVariantKey(key)
					const definition = item.value?.get("definition") as YAMLMap
					const defDoc = newDoc()
					defDoc.contents = definition
					variantsToAdd[key] = {
						name: item.value?.get("name") as string,
						label: item.value?.get("label") as string,
						component: item.value?.get("component") as string,
						extends: item.value?.get("extends") as string,
						namespace: variantNamespace,
						definition: definition.toJSON() || {},
						yaml: defDoc,
						originalYaml: defDoc,
					}
				})

				if (!Object.keys(variantsToAdd).length) return
				componentVariantAdapter.upsertMany(state, variantsToAdd)
			}
		})
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
			setYaml,
			(state, { payload }: PayloadAction<YamlUpdatePayload>) => {
				const [metadataType, metadataItem, localPath] =
					getFullPathParts(payload.path)
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
	},
})

export default componentVariantSlice.reducer
