import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { getParentPath } from "../../component/path"
import { changeDefinitionKey, removeDefinition } from "../viewdef"
import { BuilderState, MetadataListResponse, MetadataListStore } from "./types"
import { set as setRoute } from "../route"
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
		builder.addCase(setRoute, (state) => {
			state.namespaces = null
			state.metadata = null
		})
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
	setMetadataList,
	setPanelClosed,
} = builderSlice.actions
export default builderSlice.reducer
