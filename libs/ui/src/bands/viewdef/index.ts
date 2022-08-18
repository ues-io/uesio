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
import { move } from "../utils"
import {
	addDefinition,
	setDefinition,
	setDefinitionContent,
	removeDefinition,
	cloneDefinition,
	cloneKeyDefinition,
	changeDefinitionKey,
	moveDefinition,
} from "../builder"

import { RootState, getCurrentState } from "../../store/store"
import { parse } from "../../yamlutils/yamlutils"
import { Definition } from "../../definition/definition"

const removeAtPath = (viewdef: PlainViewDef, path: string) => {
	const pathArray = toPath(path)
	const index = pathArray.pop() // Get the index
	const parent = get(viewdef.definition, pathArray)
	if (!parent || !index) return
	Array.isArray(parent)
		? parent.splice(parseInt(index, 10), 1)
		: delete parent[index]
}

const addAtPath = (
	viewdef: PlainViewDef,
	path: string,
	definition: Definition,
	index: number | undefined
) => {
	const parent = get(viewdef.definition, path)
	if (!parent) {
		set(viewdef.definition, path, [definition])
		return
	}
	parent.splice(index || 0, 0, definition)
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
			addAtPath(viewDef, localPath, definition, index)
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
		builder.addCase(moveDefinition, (state, { payload }) => {
			const [toType, toItem, localToPath] = getFullPathParts(
				payload.toPath
			)
			const [fromType, fromItem, localFromPath] = getFullPathParts(
				payload.fromPath
			)

			if (toType !== fromType) return
			if (toItem !== fromItem) return
			const viewDef = state.entities[toItem]
			if (!viewDef) return

			const fromNode = get(viewDef.definition, localFromPath)
			const fromParentPath = getParentPath(localFromPath)
			const fromParent = get(viewDef.definition, fromParentPath)
			const toParentPath = getParentPath(localToPath)
			const toParent = get(viewDef.definition, toParentPath)

			const clonedNode = JSON.parse(JSON.stringify(fromNode))

			const isArrayMove =
				Array.isArray(fromParent) && Array.isArray(toParent)
			const isMapMove = !isArrayMove && fromParentPath === toParentPath

			if (isArrayMove) {
				// Set that content at the to item
				const fromIndex = getIndexFromPath(localFromPath) || 0
				const toIndex = getIndexFromPath(localToPath) || 0
				if (fromParentPath === toParentPath) {
					move(toParent, fromIndex, toIndex)
					return
				}

				addAtPath(viewDef, toParentPath, clonedNode, toIndex)
				// Loop over the items of the from parent
				fromParent.forEach((item, index) => {
					if (item === fromNode) {
						fromParent.splice(index, 1)
					}
				})
			}
			if (isMapMove) {
				const fromKey = getKeyAtPath(localFromPath)
				const toKey = getKeyAtPath(localToPath)
				const entries = Object.entries(fromParent)
				const fromIndex = entries.findIndex(([key]) => key === fromKey)
				const toIndex = entries.findIndex(([key]) => key === toKey)
				const temp = entries[fromIndex]
				entries[fromIndex] = entries[toIndex]
				entries[toIndex] = temp
				set(
					viewDef.definition,
					fromParentPath,
					Object.fromEntries(entries)
				)
			}
		})
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
			const newItem = get(viewDef.definition, pathArray)
			// Skip this process if we already have an item at the new key
			if (newItem) return
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
