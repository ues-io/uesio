import { createSlice, createEntityAdapter, EntityState } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { MetadataState } from "../metadata/types"

import {
	addDefinition,
	setDefinition,
	setDefinitionContent,
	removeDefinition,
	save,
	cancel,
} from "../builder"
import {
	getFullPathParts,
	getParentPathArray,
	toPath,
} from "../../component/path"
import {
	addNodeAtPath,
	parse,
	removeNodeAtPath,
	setNodeAtPath,
} from "../../yamlutils/yamlutils"

const adapter = createEntityAdapter<MetadataState>({
	selectId: (metadatatext) =>
		`${metadatatext.metadatatype}:${metadatatext.key}`,
})

const selectors = adapter.getSelectors((state: RootState) => state.metadatatext)

const cancelAll = (state: EntityState<MetadataState>) => {
	const items = state.entities
	for (const defKey of Object.keys(items)) {
		const defState = items[defKey]
		if (!defState) continue
		const content = defState.content
		const original = defState.original
		if (content === original) continue
		if (!original) continue
		defState.content = original
		delete defState.original
	}
	return state
}

const saveAll = (state: EntityState<MetadataState>) => {
	const items = state.entities
	for (const defKey of Object.keys(items)) {
		const defState = items[defKey]
		if (!defState) continue
		delete defState.original
	}
	return state
}

const getItem = (
	state: EntityState<MetadataState>,
	path: string
): [string, MetadataState | undefined] => {
	const [metadataType, metadataItem, localPath] = getFullPathParts(path)
	return [localPath, state.entities[`${metadataType}:${metadataItem}`]]
}

const metadataSlice = createSlice({
	name: "metadatatext",
	initialState: adapter.getInitialState(),
	reducers: {
		set: adapter.upsertOne,
		setMany: adapter.upsertMany,
	},
	extraReducers: (builder) => {
		builder.addCase(addDefinition, (state, { payload }) => {
			const { path, definition, index } = payload
			const [localPath, item] = getItem(state, path)
			if (!item) return
			const yamlDoc = parse(item.content)
			const newNode = yamlDoc.createNode(definition)
			addNodeAtPath(
				toPath(localPath),
				yamlDoc.contents,
				newNode,
				index || 0
			)
			if (!item.original) item.original = item.content
			item.content = yamlDoc.toString()
		})
		builder.addCase(setDefinition, (state, { payload }) => {
			const { path, definition } = payload
			const [localPath, item] = getItem(state, path)
			if (!item) return
			const yamlDoc = parse(item.content)
			const pathArray = toPath(localPath)
			const parentPath = getParentPathArray(pathArray)
			const parentNode = yamlDoc.getIn(parentPath)
			// create a new document so components using useYaml will rerender
			// --
			// if the parent is "null" or "undefined", the yaml library won't set our pair in the object.
			// We need to
			const newNodeSrc = parentNode
				? definition
				: { [`${toPath(localPath).pop()}`]: definition }
			const pathToUpdate = parentNode ? pathArray : parentPath
			const newNode = yamlDoc.createNode(newNodeSrc)
			setNodeAtPath(pathToUpdate, yamlDoc.contents, newNode)
			if (!item.original) item.original = item.content
			item.content = yamlDoc.toString()
		})
		builder.addCase(setDefinitionContent, (state, { payload }) => {
			const { metadataType, metadataItem, content } = payload
			const item = state.entities[`${metadataType}:${metadataItem}`]
			if (!item) return
			if (!item.original) item.original = item.content
			item.content = content
		})
		builder.addCase(save, saveAll)
		builder.addCase(cancel, cancelAll)
		builder.addCase(removeDefinition, (state, { payload }) => {
			const { path } = payload
			const [localPath, item] = getItem(state, path)
			if (!item) return
			const pathArray = toPath(localPath)
			const yamlDoc = parse(item.content)
			removeNodeAtPath(pathArray, yamlDoc.contents)
			if (!item.original) item.original = item.content
			item.content = yamlDoc.toString()
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
		*/
	},
})

export { selectors }

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
