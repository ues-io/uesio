import {
	useBuilderMode,
	useDragNode,
	useDropNode,
	useBuilderView,
	useRightPanel,
	useLeftPanel,
	useMetadataList,
	useAvailableNamespaces,
	useNodeState,
	useSelectedNode,
	useLastModifiedNode,
} from "../bands/builder/selectors"
import { Uesio } from "./hooks"
import { Context } from "../context/context"
import { SignalDefinition } from "../definition/signal"
import { metadata } from "@uesio/constants"
import {
	setActiveNode,
	setPanelClosed,
	setDragNode,
	setDropNode,
	setLeftPanel,
	setRightPanel,
	setSelectedNode,
	setView,
	toggleBuildMode,
} from "../bands/builder"
import { AnyAction } from "redux"
import builderOps from "../bands/builder/operations"
import { Dispatcher } from "../store/store"
import { useBuilderHasChanges } from "../bands/viewdef/selectors"
import { cancel as cancelViewChanges } from "../bands/viewdef"
import saveViewDef from "../bands/viewdef/operations/save"

class BuilderAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<AnyAction>

	useNodeState = useNodeState
	useSelectedNode = useSelectedNode
	useLastModifiedNode = useLastModifiedNode
	useMode = useBuilderMode
	useDragNode = useDragNode
	useDropNode = useDropNode
	useLeftPanel = useLeftPanel
	useRightPanel = useRightPanel
	useView = useBuilderView
	useHasChanges = useBuilderHasChanges

	useMetadataList = useMetadataList
	useAvailableNamespaces = useAvailableNamespaces

	setActiveNode = (path: string) => {
		this.dispatcher(setActiveNode(path))
	}
	setPanelClosed = () => {
		this.dispatcher(setPanelClosed())
	}
	setSelectedNode = (path: string) => {
		this.dispatcher(setSelectedNode(path))
	}

	setDragNode = (path: string) => {
		this.dispatcher(setDragNode(path))
	}

	setDropNode = (path: string) => {
		this.dispatcher(setDropNode(path))
	}

	setRightPanel = (panel: string) => {
		this.dispatcher(setRightPanel(panel))
	}

	setLeftPanel = (panel: string) => {
		this.dispatcher(setLeftPanel(panel))
	}

	setView = (view: string) => {
		this.dispatcher(setView(view))
	}

	toggleBuildMode = () => {
		this.dispatcher(toggleBuildMode())
	}

	save = () =>
		this.uesio.signal.dispatcher(
			saveViewDef({ context: this.uesio.getContext() || new Context() })
		)

	cancel = () => {
		this.dispatcher(cancelViewChanges())
	}

	getMetadataList = (
		context: Context,
		metadataType: metadata.MetadataType,
		namespace: string,
		grouping?: string
	) =>
		this.dispatcher(
			builderOps.getMetadataList(
				context,
				metadataType,
				namespace,
				grouping
			)
		)

	getAvailableNamespaces = (context: Context) =>
		this.dispatcher(builderOps.getAvailableNamespaces(context))

	getSignalProperties = (signal: SignalDefinition) =>
		this.uesio.signal.getProperties(signal)
}

export { BuilderAPI }
