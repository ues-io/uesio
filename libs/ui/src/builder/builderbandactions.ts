import { BandAction } from "../store/actions/actions"
import { MetadataType } from "../buildmode/buildpropdefinition"
import { MetadataListStore } from "../store/types/builderstate"

const SET_ACTIVE_NODE = "SET_ACTIVE_NODE"
const SET_SELECTED_NODE = "SET_SELECTED_NODE"
const TOGGLE_BUILD_MODE = "SET_BUILD_MODE"
const SET_DRAG_NODE = "SET_DRAG_NODE"
const SET_DROP_NODE = "SET_DROP_NODE"
const SET_LEFT_PANEL = "SET_LEFT_PANEL"
const SET_RIGHT_PANEL = "SET_RIGHT_PANEL"
const SET_VIEW = "SET_VIEW"
const SET_METADATA_LIST = "SET_METADATA_LIST"
const SET_AVAILABLE_NAMESPACES = "SET_AVAILABLE_NAMESPACES"
const CLEAR_AVAILABLE_METADATA = "CLEAR_AVAILABLE_METADATA"

interface SetActiveNodeAction extends BandAction {
	name: typeof SET_ACTIVE_NODE
	data: {
		path: string
	}
}

interface SetSelectedNodeAction extends BandAction {
	name: typeof SET_SELECTED_NODE
	data: {
		path: string
	}
}

interface ToggleBuildModeAction extends BandAction {
	name: typeof TOGGLE_BUILD_MODE
}

interface SetDragNodeAction extends BandAction {
	name: typeof SET_DRAG_NODE
	data: {
		path: string
	}
}

interface SetDropNodeAction extends BandAction {
	name: typeof SET_DROP_NODE
	data: {
		path: string
	}
}

interface SetLeftPanelAction extends BandAction {
	name: typeof SET_LEFT_PANEL
	data: {
		panel: string
	}
}

interface SetRightPanelAction extends BandAction {
	name: typeof SET_RIGHT_PANEL
	data: {
		panel: string
	}
}

interface SetViewAction extends BandAction {
	name: typeof SET_VIEW
	data: {
		view: string
	}
}

interface SetMetadataListAction extends BandAction {
	name: typeof SET_METADATA_LIST
	data: {
		metadataType: MetadataType
		namespace: string
		grouping?: string
		metadata: MetadataListStore
	}
}

interface SetAvailableNamespacesAction extends BandAction {
	name: typeof SET_AVAILABLE_NAMESPACES
	data: {
		namespaces: MetadataListStore
	}
}

interface ClearAvailableMetadataAction extends BandAction {
	name: typeof CLEAR_AVAILABLE_METADATA
}

type BuilderBandAction =
	| SetActiveNodeAction
	| SetSelectedNodeAction
	| ToggleBuildModeAction
	| SetDragNodeAction
	| SetDropNodeAction
	| SetLeftPanelAction
	| SetRightPanelAction
	| SetViewAction
	| SetMetadataListAction
	| SetAvailableNamespacesAction
	| ClearAvailableMetadataAction

export {
	SetActiveNodeAction,
	SetSelectedNodeAction,
	ToggleBuildModeAction,
	SetDragNodeAction,
	SetDropNodeAction,
	SetLeftPanelAction,
	SetRightPanelAction,
	SetViewAction,
	SetMetadataListAction,
	SetAvailableNamespacesAction,
	ClearAvailableMetadataAction,
	SET_SELECTED_NODE,
	SET_ACTIVE_NODE,
	TOGGLE_BUILD_MODE,
	SET_DRAG_NODE,
	SET_DROP_NODE,
	SET_LEFT_PANEL,
	SET_RIGHT_PANEL,
	SET_VIEW,
	SET_METADATA_LIST,
	SET_AVAILABLE_NAMESPACES,
	CLEAR_AVAILABLE_METADATA,
	BuilderBandAction,
}
