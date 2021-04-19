import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import {
	getParentPath,
	toPath,
	fromPath,
	calculateNewPathAheadOfTime,
} from "../../component/path"
import {
	addDefinition,
	changeDefinitionKey,
	removeDefinition,
	moveDefinition,
	setDefinition,
	cancel,
} from "../viewdef"
import { BuilderState } from "./types"
import { DefinitionMap } from "../../definition/definition"
import builderOps from "./operations"

import { set as setRoute } from "../route"
import { getMetadataListKey } from "./selectors"

const builderSlice = createSlice({
	name: "builder",
	initialState: {} as BuilderState,
	reducers: {
		setActiveNode: (state, { payload }: PayloadAction<string>) => {
			state.activeNode = payload
		},
		setSelectedNode: (state, { payload }: PayloadAction<string>) => {
			state.selectedNode = payload
		},
		setDragNode: (state, { payload }: PayloadAction<string>) => {
			state.draggingNode = payload
		},
		setDropNode: (state, { payload }: PayloadAction<string>) => {
			state.droppingNode = payload
		},
	},
	extraReducers: (builder) => {
		builder.addCase(
			builderOps.getAvailableNamespaces.fulfilled,
			(state, { payload }) => {
				state.namespaces = {
					status: "FULFILLED",
					data: payload,
				}
			}
		)
		builder.addCase(builderOps.getAvailableNamespaces.pending, (state) => {
			state.namespaces = {
				status: "PENDING",
				data: null,
			}
		})
		builder.addCase(
			builderOps.getMetadataList.fulfilled,
			(state, { payload, meta }) => {
				const key = getMetadataListKey(
					meta.arg.metadataType,
					meta.arg.namespace,
					meta.arg.grouping
				)
				if (!state.metadata) {
					state.metadata = {}
				}
				state.metadata[key] = {
					status: "FULFILLED",
					data: payload,
				}
			}
		)
		builder.addCase(
			builderOps.getMetadataList.pending,
			(state, { meta }) => {
				const key = getMetadataListKey(
					meta.arg.metadataType,
					meta.arg.namespace,
					meta.arg.grouping
				)
				if (!state.metadata) {
					state.metadata = {}
				}
				state.metadata[key] = {
					status: "PENDING",
					data: null,
				}
			}
		)
		builder.addCase(changeDefinitionKey, (state, { payload }) => {
			const parentPath = getParentPath(payload.path)
			const keyPath = `${parentPath}["${payload.key}"]`
			state.selectedNode = keyPath
			state.lastModifiedNode = parentPath
		})
		builder.addCase(removeDefinition, (state) => {
			state.selectedNode = ""
			state.lastModifiedNode = ""
		})
		builder.addCase(setRoute, (state) => {
			state.namespaces = null
			state.metadata = null
		})
		builder.addCase(setDefinition, (state, { payload }) => {
			state.lastModifiedNode = payload.path
		})
		builder.addCase(cancel, (state) => {
			state.lastModifiedNode = ""
		})
		builder.addCase(addDefinition, (state, { payload }) => {
			state.lastModifiedNode = payload.path + `["${payload.index || 0}"]`
			if (!payload.bankDrop || payload.index === undefined) {
				// Added a not dragged component
				// (added button to buttonset for example)
				// in which case we do not want to shift the
				// selected node
				return
			}
			const def = <DefinitionMap>payload.definition
			const key = Object.keys(def)[0]
			state.selectedNode = `${payload.path}["${payload.index}"]["${key}"]`
		})
		builder.addCase(moveDefinition, (state, { payload }) => {
			const updatedPath = calculateNewPathAheadOfTime(
				payload.fromPath,
				payload.toPath
			)
			state.selectedNode = updatedPath
			const pathArr = toPath(updatedPath)
			pathArr.splice(-1) //We just want the index, not the key level
			state.lastModifiedNode = fromPath(pathArr)
		})
	},
})

export const {
	setActiveNode,
	setSelectedNode,
	setDragNode,
	setDropNode,
} = builderSlice.actions
export default builderSlice.reducer
