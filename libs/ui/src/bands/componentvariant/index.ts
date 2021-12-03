import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import loadOp from "../viewdef/operations/load"
import { getNodeAtPath, newDoc, parse } from "../../yamlutils/yamlutils"
import componentVariantAdapter from "./adapter"
import { getFullPathParts, parseVariantKey } from "../../component/path"
import { ComponentVariant } from "./types"
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
import {
	moveDef,
	addDef,
	setDef,
	removeDef,
	updateYaml,
} from "../../store/reducers"

const componentVariantSlice = createSlice({
	name: "componentVariant",
	initialState: componentVariantAdapter.getInitialState(),
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(loadOp.fulfilled, (state, { payload }) => {
			const yamlDoc = parse(payload)

			const variants: Record<string, ComponentVariant> = getNodeAtPath(
				["dependencies", "componentvariants"],
				yamlDoc.contents
			)?.toJSON()

			if (!variants) return

			const variantsToAdd: ComponentVariant[] = Object.keys(variants).map(
				(variantKey: string) => {
					const variant = variants[variantKey] as ComponentVariant
					const { label, name, component, definition } = variant
					const [, , variantNamespace] = parseVariantKey(variantKey)
					const defDoc = newDoc(definition)
					return {
						name,
						label,
						component,
						extends: variant.extends,
						namespace: variantNamespace,
						definition,
						yaml: defDoc,
						originalYaml: defDoc,
					}
				}
			)

			componentVariantAdapter.upsertMany(state, variantsToAdd)
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
