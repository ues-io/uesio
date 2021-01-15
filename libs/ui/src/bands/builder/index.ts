import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { getParentPath } from "../../component/path"
import {
	changeDefinitionKey,
	removeDefinition,
	addDefinition,
	// moveDefinition,
} from "../viewdef"
import { BuilderState, MetadataListResponse, MetadataListStore } from "./types"
import { DefinitionMap } from "../../definition/definition"
const builderSlice = createSlice({
	name: "builder",
	initialState: {} as BuilderState,
	reducers: {
		setActiveNode: (state, { payload }: PayloadAction<string>) => {
			state.activeNode = payload
		},
		setSelectedNode: (state, { payload }: PayloadAction<string>) => {
			state.selectedNode = payload
			if (payload && !state.leftPanel) {
				state.leftPanel = "components"
			}
		},
		setPanelClosed: (state) => {
			state.selectedNode = ""
			state.leftPanel = ""
		},
		toggleBuildMode: (state) => {
			state.buildMode = !state.buildMode
		},
		setDragNode: (state, { payload }: PayloadAction<string>) => {
			state.draggingNode = payload
		},
		setDropNode: (state, { payload }: PayloadAction<string>) => {
			state.droppingNode = payload
		},
		setLeftPanel: (state, { payload }: PayloadAction<string>) => {
			state.leftPanel = payload
		},
		setRightPanel: (state, { payload }: PayloadAction<string>) => {
			state.rightPanel = payload
		},
		setView: (state, { payload }: PayloadAction<string>) => {
			state.buildView = payload
		},
		setAvailableNamespaces: (
			state,
			{ payload }: PayloadAction<MetadataListStore>
		) => {
			state.namespaces = payload
		},
		clearAvailableMetadata: (state) => {
			state.namespaces = null
			state.metadata = null
		},
		setMetadataList: (
			state,
			{
				payload: { metadataType, namespace, grouping, metadata },
			}: PayloadAction<MetadataListResponse>
		) => ({
			...state,
			metadata: {
				...state.metadata,
				[metadataType]: {
					...state.metadata?.[metadataType],
					[namespace]: grouping
						? {
								...state.metadata?.[metadataType]?.[namespace],
								[grouping]: metadata,
						  }
						: metadata,
				},
			},
		}),
	},
	extraReducers: (builder) => {
		builder.addCase(changeDefinitionKey, (state, { payload }) => {
			state.selectedNode = `${getParentPath(payload.path)}["${
				payload.key
			}"]`
		})
		builder.addCase(removeDefinition, (state) => {
			state.selectedNode = ""
		})
		builder.addCase(addDefinition, (state, { payload }) => {
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
		// builder.addCase(moveDefinition, (state, { payload }) => {
		// 	// state.selectedNode = payload.toPath
		// })
	},
})

export const {
	setActiveNode,
	setSelectedNode,
	toggleBuildMode,
	setDragNode,
	setDropNode,
	setLeftPanel,
	setRightPanel,
	setView,
	setAvailableNamespaces,
	clearAvailableMetadata,
	setMetadataList,
	setPanelClosed,
} = builderSlice.actions
export default builderSlice.reducer
