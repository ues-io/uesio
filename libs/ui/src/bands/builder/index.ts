import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import {getParentPath} from "../../component/path"
import {addDefinition, changeDefinitionKey, moveDefinition, removeDefinition,} from "../viewdef"
import {BuilderState, MetadataListResponse, MetadataListStore} from "./types"
import {DefinitionMap} from "../../definition/definition"
import convertToPath from 'lodash.topath'

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
		builder.addCase(moveDefinition, (state, { payload }) => {
			state.selectedNode = calculateNewPathAheadOfTime(payload.fromPath, payload.toPath)
		})
	},
})
function isInt(str: string) {
	let i = 0;
	if(str.length === 0) return false
	while(i < str.length) {
		if(str[i] > '9' || str[i] < '0') return false;
		i++
	}
	return true
}
function calculateNewPathAheadOfTime(fromPathStr: string, toPathStr: string) {
	//"components", "0", "material.container", "components", "0"
	const fromPath = convertToPath(fromPathStr)
	// "components", "0", "material.container", "components", "1", "material.deck", "components", "0"
	const toPath = convertToPath(toPathStr)

	let index = 0;
	let foundDifferenceBeforeEnd = false;
	while((fromPath.length > index) && (toPath.length > index)) {
		if (fromPath[index] !== toPath[index]) {
			if(!isInt(fromPath[index]) || !isInt(toPath[index])) {
				return toPathStr
			}
			foundDifferenceBeforeEnd = true;
			break; // Found a difference in int indexes
		}
		index++
	}
	console.log(fromPathStr, toPathStr)
	if(!foundDifferenceBeforeEnd) {
		return toPathStr
	}
	//If we got here we shifted indexes between from and to path - so we need to handle edge cases
	const fromIndex = parseInt(fromPath[index], 10)
	const toIndex = parseInt(toPath[index], 10)

	if(toIndex < fromIndex) {
		// No problem - we moved before where we were - so our calculated
		// path is still correct
		return toPathStr
	}

	if((toPath.length - 1) === index) {
		// The level we moved out of is our own top most level - so the
		// index is actually correct
		debugger;
		return toPathStr
	}
	debugger;
	// Otherwise we moved into a deeper level than we were before, and
	// after where we were so we need to decrement where we think we are going
	// to account for a parent generation entry no longer being in that space
	toPath[index] = (toIndex - 1)+""
	//Covert it back to the stringified path
	return `["${toPath.join('"]["')}"]`
}

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
