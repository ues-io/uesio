import { createSlice, createEntityAdapter, EntityState } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { MetadataState } from "../metadata/types"
import { move } from "../utils"

import {
	addDefinition,
	setDefinition,
	setDefinitionContent,
	removeDefinition,
	save,
	cancel,
	cloneDefinition,
	cloneKeyDefinition,
	changeDefinitionKey,
	moveDefinition,
} from "../builder"
import {
	getFullPathParts,
	getIndexFromPath,
	getKeyAtPath,
	getParentPath,
	getParentPathArray,
	toPath,
} from "../../component/path"
import {
	addNodeAtPath,
	getNodeAtPath,
	parse,
	removeNodeAtPath,
	setNodeAtPath,
} from "../../yamlutils/yamlutils"
import { isCollection, isMap, isSeq, Scalar } from "yaml"

const adapter = createEntityAdapter<MetadataState>({
	selectId: (metadatatext) =>
		`${metadatatext.metadatatype}:${metadatatext.key}`,
})

const toStringOptions = {
	indent: 2,
}

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
			item.content = yamlDoc.toString(toStringOptions)
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
			item.content = yamlDoc.toString(toStringOptions)
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
			item.content = yamlDoc.toString(toStringOptions)
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
			const item = state.entities[`${toType}:${toItem}`]
			if (!item) return
			const yamlDoc = parse(item.content)
			// First get the content of the from item
			const fromNode = getNodeAtPath(localFromPath, yamlDoc.contents)
			const fromParentPath = getParentPath(localFromPath)
			const fromParent = getNodeAtPath(fromParentPath, yamlDoc.contents)
			const toParentPath = getParentPath(localToPath)
			//const toParent = getNodeAtPath(toParentPath, yamlDoc.contents)
			const clonedNode = fromNode?.clone()
			if (!isCollection(clonedNode)) return
			const isArrayMove = isSeq(fromParent)
			const isMapMove =
				isMap(fromParent) && fromParentPath === toParentPath

			if (isArrayMove) {
				const index = getIndexFromPath(localToPath) || 0
				if (fromParentPath === toParentPath) {
					const fromIndex = getIndexFromPath(localFromPath) || 0
					// When in the same list parent, we can just swap
					move(fromParent.items, fromIndex, index)
				} else {
					// Set that content at the to item
					addNodeAtPath(
						toParentPath,
						yamlDoc.contents,
						clonedNode,
						index
					)

					// Loop over the items of the from parent
					fromParent.items.forEach((item, index) => {
						if (item === fromNode) {
							fromParent.items.splice(index, 1)
						}
					})
				}
			}
			if (isMapMove) {
				const fromKey = getKeyAtPath(localFromPath)
				const toKey = getKeyAtPath(localToPath)
				const fromIndex = fromParent.items.findIndex(
					(item) => (item.key as Scalar).value === fromKey
				)
				const toIndex = fromParent.items.findIndex(
					(item) => (item.key as Scalar).value === toKey
				)
				const temp = fromParent.items[fromIndex]
				fromParent.items[fromIndex] = fromParent.items[toIndex]
				fromParent.items[toIndex] = temp
			}

			if (!item.original) item.original = item.content

			item.content = yamlDoc.toString(toStringOptions)
		})
		builder.addCase(cloneDefinition, (state, { payload }) => {
			const { path } = payload
			const [localPath, item] = getItem(state, path)
			if (!item) return
			const yamlDoc = parse(item.content)
			const parentPath = getParentPath(localPath)
			const index = getIndexFromPath(localPath)
			if (!index && index !== 0) return
			const parentNode = getNodeAtPath(parentPath, yamlDoc.contents)
			if (!isSeq(parentNode)) return
			const items = parentNode.items
			items.splice(index, 0, items[index])
			if (!item.original) item.original = item.content
			item.content = yamlDoc.toString(toStringOptions)
		})
		builder.addCase(cloneKeyDefinition, (state, { payload }) => {
			const { path, newKey } = payload
			const [localPath, item] = getItem(state, path)
			if (!item) return
			const yamlDoc = parse(item.content)
			const parentPath = getParentPath(localPath)
			const cloneNode = getNodeAtPath(localPath, yamlDoc.contents)
			const parentNode = getNodeAtPath(parentPath, yamlDoc.contents)
			if (!isMap(parentNode)) return
			parentNode.setIn([newKey], cloneNode)
			if (!item.original) item.original = item.content
			item.content = yamlDoc.toString(toStringOptions)
		})
		builder.addCase(changeDefinitionKey, (state, { payload }) => {
			const { path, key: newKey } = payload
			const [localPath, item] = getItem(state, path)
			if (!item) return
			const pathArray = toPath(localPath)
			// Stop if old and new key are equal
			if (getKeyAtPath(localPath) === newKey) return
			// create a new document so components using useYaml will rerender
			const yamlDoc = parse(item.content)
			// make a copy so we can place with a new key and delete the old node
			const newNode = yamlDoc.getIn(pathArray)
			// replace the old with the new key
			pathArray.splice(-1, 1, newKey)

			/*
			Keys need to be unique.
			TEST:oldKeyEqualsNew
			*/
			if (yamlDoc.getIn(pathArray)) return

			yamlDoc.setIn(pathArray, newNode)
			yamlDoc.deleteIn(toPath(localPath))
			if (!item.original) item.original = item.content
			item.content = yamlDoc.toString(toStringOptions)
		})
	},
})

export { selectors }

export const { set, setMany } = metadataSlice.actions
export default metadataSlice.reducer
