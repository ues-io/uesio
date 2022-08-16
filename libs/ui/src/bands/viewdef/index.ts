import { createSlice, createEntityAdapter, EntityState } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"
import {
	getFullPathParts,
	getIndexFromPath,
	getKeyAtPath,
	getParentPath,
	toPath,
} from "../../component/path"
import set from "lodash/set"
import get from "lodash/get"

import { PlainViewDef } from "../../definition/viewdef"

import {
	addDefinition,
	setDefinition,
	setDefinitionContent,
	removeDefinition,
	cloneDefinition,
	cloneKeyDefinition,
	changeDefinitionKey,
} from "../builder"

import { RootState, getCurrentState } from "../../store/store"
import { parse } from "../../yamlutils/yamlutils"

const removeAtPath = (viewdef: PlainViewDef, path: string) => {
	const pathArray = toPath(path)
	const index = pathArray.pop() // Get the index
	const parent = get(viewdef.definition, pathArray)
	if (!parent || !index) return
	delete parent[index]
}

const adapter = createEntityAdapter<PlainViewDef>({
	selectId: (v) => `${v.namespace}.${v.name}`,
})

const selectors = adapter.getSelectors((state: RootState) => state.viewdef)

const getViewDefState = (
	state: EntityState<PlainViewDef>,
	path: string
): [string, PlainViewDef | undefined] => {
	const [metadataType, metadataItem, localPath] = getFullPathParts(path)
	return [
		localPath,
		metadataType === "viewdef" ? state.entities[metadataItem] : undefined,
	]
}

const metadataSlice = createSlice({
	name: "viewdef",
	initialState: adapter.getInitialState(),
	reducers: {
		setMany: adapter.upsertMany,
	},

	extraReducers: (builder) => {
		builder.addCase(addDefinition, (state, { payload }) => {
			const { definition, path, index } = payload
			const [localPath, viewDef] = getViewDefState(state, path)
			if (!viewDef) return
			const parent = get(viewDef.definition, localPath)
			if (!parent) {
				set(viewDef.definition, localPath, [definition])
				return
			}
			parent.splice(index || 0, 0, definition)
		})
		builder.addCase(setDefinition, (state, { payload }) => {
			const { definition, path } = payload
			const [localPath, viewDef] = getViewDefState(state, path)
			if (!viewDef) return
			set(viewDef.definition, localPath, definition)
		})
		builder.addCase(setDefinitionContent, (state, { payload }) => {
			if (payload.metadataType !== "viewdef") return
			const viewDef = state.entities[payload.metadataItem]
			if (!viewDef) return
			const defDoc = parse(payload.content)
			viewDef.definition = defDoc.toJSON()
		})
		builder.addCase(removeDefinition, (state, { payload }) => {
			const [localPath, viewDef] = getViewDefState(state, payload.path)
			if (!viewDef) return
			removeAtPath(viewDef, localPath)
		})
		/*
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
		*/
		builder.addCase(changeDefinitionKey, (state, { payload }) => {
			const { path, key: newKey } = payload
			const [localPath, viewDef] = getViewDefState(state, path)
			if (!viewDef) return
			const pathArray = toPath(localPath)
			// Stop if old and new key are equal
			if (getKeyAtPath(localPath) === newKey) return
			const old = get(viewDef.definition, localPath)
			// replace the old with the new key
			pathArray.splice(-1, 1, newKey)
			set(viewDef.definition, pathArray, old)
			removeAtPath(viewDef, localPath)
		})
		builder.addCase(cloneDefinition, (state, { payload }) => {
			const [localPath, viewDef] = getViewDefState(state, payload.path)
			if (!viewDef) return
			const parentPath = getParentPath(localPath)
			const index = getIndexFromPath(localPath)
			if (!index && index !== 0) return
			const parent = get(viewDef.definition, parentPath)
			if (!parent) return
			parent.splice(index, 0, parent[index])
		})
		builder.addCase(cloneKeyDefinition, (state, { payload }) => {
			const [localPath, viewDef] = getViewDefState(state, payload.path)
			if (!viewDef) return
			const parentPath = getParentPath(localPath)
			const clone = get(viewDef.definition, localPath)
			const parent = get(viewDef.definition, parentPath)
			if (!parent || !clone) return
			set(viewDef.definition, `${parentPath}["${payload.newKey}"]`, clone)
		})
	},
})

const useViewDef = (key: string) =>
	useSelector((state: RootState) => selectors.selectById(state, key))
		?.definition

// This function doesn't run a selector so it will only get the current
// state of the store and not update with changes
const getViewDef = (key: string) =>
	selectors.selectById(getCurrentState(), key)?.definition

export { useViewDef, selectors, getViewDef }

export const { setMany } = metadataSlice.actions
export default metadataSlice.reducer
