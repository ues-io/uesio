import { createSlice, PayloadAction } from "@reduxjs/toolkit"

import { BuilderState } from "./types"
import { Definition, DefinitionMap } from "../../definition/definition"
import builderOps from "./operations"

import { getMetadataListKey } from "./selectors"
import { getParentPath } from "../../component/path"
import { set as setRoute } from "../route"

type SetDefinitionPayload = {
	path: string
	definition: Definition
}

type AddDefinitionPayload = {
	path: string
	definition: Definition
	index?: number
	type?: string
}

type AddDefinitionPairPayload = {
	path: string
	definition: Definition
	key: string
	type?: string
}

type RemoveDefinitionPayload = {
	path: string
}

type MoveDefinitionPayload = {
	toPath: string
	fromPath: string
	selectKey?: string // Optionally select one level deeper
}

type ChangeDefinitionKeyPayload = {
	path: string
	key: string
}

type SetDefinitionContentPayload = {
	metadataType: string
	metadataItem: string
	content: string
}

type CloneDefinitionPayload = {
	path: string
}

const builderSlice = createSlice({
	name: "builder",
	initialState: {} as BuilderState,
	reducers: {
		setDefinition: (
			state,
			{ payload }: PayloadAction<SetDefinitionPayload>
		) => {
			state.lastModifiedNode = payload.path
		},
		//
		cloneDefinition: (
			state,
			{ payload }: PayloadAction<CloneDefinitionPayload>
		) => {
			// nothing actually happens here, just something for others to listen to.
			state.lastModifiedNode = payload.path
		},
		addDefinition: (
			state,
			{ payload }: PayloadAction<AddDefinitionPayload>
		) => {
			state.lastModifiedNode = payload.path + `["${payload.index || 0}"]`
			if (payload.type === "component") {
				const def = payload.definition as DefinitionMap
				const key = Object.keys(def)[0]
				state.selectedNode = `${payload.path}["${payload.index}"]["${key}"]`
			}
		},
		addDefinitionPair: (
			state,
			{ payload }: PayloadAction<AddDefinitionPairPayload>
		) => {
			if (payload.type === "wire" || payload.type === "panel") {
				state.selectedNode = `${payload.path}["${payload.key}"]`
			}
		},
		removeDefinition: (
			state,
			{ payload }: PayloadAction<RemoveDefinitionPayload>
		) => {
			// nothing actually happens here, just something for others to listen to.
			if (payload.path === state.selectedNode) {
				state.selectedNode = ""
			}
			state.lastModifiedNode = ""
		},
		changeDefinitionKey: (
			state,
			{
				payload: { path, key },
			}: PayloadAction<ChangeDefinitionKeyPayload>
		) => {
			const parentPath = getParentPath(path)
			state.selectedNode = `${parentPath}["${key}"]`
			state.lastModifiedNode = parentPath
		},
		moveDefinition: (
			state,
			{ payload }: PayloadAction<MoveDefinitionPayload>
		) => {
			state.selectedNode =
				payload.toPath +
				(payload.selectKey ? `["${payload.selectKey}"]` : "")
			state.lastModifiedNode = payload.toPath
		},
		save: () => {
			//console.log("SAVING")
		},
		cancel: (state) => {
			state.selectedNode = ""
			state.lastModifiedNode = ""
		},
		setDefinitionContent: (
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			state,
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			action: PayloadAction<SetDefinitionContentPayload>
		) => {
			//state.lastModifiedNode = payload.path
		},
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

		builder.addCase(setRoute, (state) => {
			state.namespaces = null
			state.metadata = null
		})
	},
})

export const {
	setActiveNode,
	setSelectedNode,
	setDragNode,
	setDropNode,
	setDefinition,
	cloneDefinition,
	addDefinition,
	addDefinitionPair,
	removeDefinition,
	moveDefinition,
	changeDefinitionKey,
	setDefinitionContent,
	save,
	cancel,
} = builderSlice.actions
export {
	CloneDefinitionPayload,
	SetDefinitionPayload,
	AddDefinitionPayload,
	AddDefinitionPairPayload,
	RemoveDefinitionPayload,
	MoveDefinitionPayload,
	ChangeDefinitionKeyPayload,
	SetDefinitionContentPayload,
}
export default builderSlice.reducer
