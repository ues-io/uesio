import { createSlice, createEntityAdapter, EntityState } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"
import { getFullPathParts } from "../../component/path"
import {
	addDef,
	addDefPair,
	changeDefKey,
	cloneDef,
	moveDef,
	removeDef,
	setDef,
} from "../../store/reducers"
import { RootState } from "../../store/store"
import { parse } from "../../yamlutils/yamlutils"
import builderOps from "../builder/operations"
import {
	addDefinition,
	addDefinitionPair,
	cancel,
	changeDefinitionKey,
	cloneDefinition,
	moveDefinition,
	removeDefinition,
	setDefinition,
	setDefinitionContent,
} from "../builder"
import { MetadataState } from "../metadata/types"

const adapter = createEntityAdapter<MetadataState>({
	selectId: (metadata) => metadata.key,
})

const selectors = adapter.getSelectors((state: RootState) => state.viewdef)

const getViewDefState = (
	state: EntityState<MetadataState>,
	path: string
): [string, MetadataState | undefined] => {
	const [metadataType, metadataItem, localPath] = getFullPathParts(path)
	return [
		localPath,
		metadataType === "viewdef" ? state.entities[metadataItem] : undefined,
	]
}

const saveAllDefs = (state: EntityState<MetadataState>) => {
	const viewdefs = state.entities

	for (const defKey of Object.keys(viewdefs)) {
		const defState = viewdefs[defKey]

		if (!defState) continue
		const content = defState.content
		const original = defState.original
		if (content === original) continue

		const yamlDoc = parse(content)

		defState.original = defState.content
		defState.parsed = yamlDoc.toJSON()
	}

	return state
}

const cancelAllDefs = (state: EntityState<MetadataState>) => {
	const viewdefs = state.entities

	for (const defKey of Object.keys(viewdefs)) {
		const defState = viewdefs[defKey]

		if (!defState) continue
		const content = defState.content
		const original = defState.original
		if (content === original) continue
		if (!original) continue

		const yamlDoc = parse(original)

		defState.content = original
		defState.parsed = yamlDoc.toJSON()
	}

	return state
}

const metadataSlice = createSlice({
	name: "viewdef",
	initialState: adapter.getInitialState(),
	reducers: {
		set: adapter.upsertOne,
		setMany: adapter.upsertMany,
	},
	extraReducers: (builder) => {
		builder.addCase(addDefinition, (state, { payload }) => {
			const [localPath, viewDef] = getViewDefState(state, payload.path)
			if (viewDef) {
				addDef(viewDef, {
					path: localPath,
					definition: payload.definition,
					index: payload.index,
				})
			}
		})
		builder.addCase(setDefinition, (state, { payload }) => {
			const [localPath, viewDef] = getViewDefState(state, payload.path)
			if (viewDef) {
				setDef(viewDef, {
					path: localPath,
					definition: payload.definition,
				})
			}
		})
		builder.addCase(setDefinitionContent, (state, { payload }) => {
			if (payload.metadataType === "viewdef") {
				const viewDef = state.entities[payload.metadataItem]
				if (viewDef) {
					const defDoc = parse(payload.content)
					viewDef.content = payload.content
					viewDef.parsed = defDoc.toJSON()
				}
			}
		})
		builder.addCase(removeDefinition, (state, { payload }) => {
			const [localPath, viewDef] = getViewDefState(state, payload.path)
			if (viewDef) {
				removeDef(viewDef, {
					path: localPath,
				})
			}
		})
		builder.addCase(moveDefinition, (state, { payload }) => {
			const [toType, toItem, toPath] = getFullPathParts(payload.toPath)
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
						toPath,
					})
			}
		})
		builder.addCase(builderOps.save.fulfilled, saveAllDefs)
		builder.addCase(cancel, cancelAllDefs)
		builder.addCase(changeDefinitionKey, (state, { payload }) => {
			const [localPath, viewDef] = getViewDefState(state, payload.path)
			if (viewDef) {
				changeDefKey(viewDef, {
					path: localPath,
					key: payload.key,
				})
			}
		})
		builder.addCase(cloneDefinition, (state, { payload }) => {
			const [localPath, viewDef] = getViewDefState(state, payload.path)
			if (viewDef) {
				cloneDef(viewDef, {
					path: localPath,
				})
			}
		})

		builder.addCase(addDefinitionPair, (state, { payload }) => {
			const [localPath, viewDef] = getViewDefState(state, payload.path)
			if (viewDef) {
				addDefPair(viewDef, {
					path: localPath,
					definition: payload.definition,
					key: payload.key,
				})
			}
		})
	},
})

const useViewDef = (key: string) =>
	useSelector((state: RootState) => selectors.selectById(state, key))

const useViewDefKeys = () => useSelector(selectors.selectIds) as string[]

export { useViewDef, useViewDefKeys, selectors }

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
