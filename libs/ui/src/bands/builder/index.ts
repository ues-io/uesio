import { createSlice, PayloadAction } from "@reduxjs/toolkit"

import { BuilderState } from "./types"
import { Definition, DefinitionMap } from "../../definition/definition"

import { getParentPath } from "../../component/path"
import { MetadataInfo } from "../../platform/platform"

type SetDefinitionPayload = {
	path: string
	definition: Definition
	autoSelect?: boolean
}

type AddDefinitionPayload = {
	path: string
	definition: Definition
	index?: number
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

type CloneKeyDefinitionPayload = {
	path: string
	newKey: string
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
			if (payload.autoSelect) {
				state.selectedNode = payload.path
			}
		},
		cloneDefinition: (
			state,
			{ payload }: PayloadAction<CloneDefinitionPayload>
		) => {
			// nothing actually happens here, just something for others to listen to.
			state.lastModifiedNode = payload.path
		},
		cloneKeyDefinition: (
			state,
			{ payload }: PayloadAction<CloneKeyDefinitionPayload>
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
		removeDefinition: (
			state,
			{ payload }: PayloadAction<RemoveDefinitionPayload>
		) => {
			// nothing actually happens here, just something for others to listen to.
			if (payload.path === state.selectedNode) {
				state.selectedNode = getParentPath(payload.path)
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
		setNamespaceInfo: (
			state,
			{ payload }: PayloadAction<Record<string, MetadataInfo>>
		) => {
			state.namespaces = payload
		},
	},
})

export const {
	setActiveNode,
	setSelectedNode,
	setDragNode,
	setDropNode,
	setDefinition,
	cloneDefinition,
	cloneKeyDefinition,
	addDefinition,
	removeDefinition,
	moveDefinition,
	changeDefinitionKey,
	setDefinitionContent,
	setNamespaceInfo,
	save,
	cancel,
} = builderSlice.actions
export {
	CloneDefinitionPayload,
	CloneKeyDefinitionPayload,
	SetDefinitionPayload,
	AddDefinitionPayload,
	RemoveDefinitionPayload,
	MoveDefinitionPayload,
	ChangeDefinitionKeyPayload,
	SetDefinitionContentPayload,
}
export default builderSlice.reducer
