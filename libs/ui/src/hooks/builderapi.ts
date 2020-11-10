import {
	Dispatcher,
	useBuilderNodeState,
	useBuilderMode,
	useBuilderSelectedNode,
	useBuilderDragNode,
	useBuilderDropNode,
	useBuilderView,
	useBuilderRightPanel,
	useBuilderLeftPanel,
	useBuilderHasChanges,
	DispatchReturn,
	useBuilderMetadataList,
	useBuilderAvailableNamespaces,
} from "../store/store"
import { BAND, StoreAction } from "../store/actions/actions"
import {
	SET_ACTIVE_NODE,
	SET_SELECTED_NODE,
	TOGGLE_BUILD_MODE,
	SET_DRAG_NODE,
	SET_RIGHT_PANEL,
	SET_LEFT_PANEL,
	SET_VIEW,
	SET_DROP_NODE,
} from "../builder/builderbandactions"
import { Uesio } from "./hooks"
import { Context } from "../context/context"
import { VIEWDEF_BAND } from "../viewdef/viewdefband"
import { SAVE, CANCEL } from "../viewdef/viewdefbandsignals"
import {
	GET_AVAILABLE_NAMESPACES,
	GET_METADATA_LIST,
} from "../builder/builderbandsignals"
import { BUILDER_BAND } from "../builder/builderband"
import { SignalDefinition } from "../definition/signal"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { getBand } from "../actor/band"
import { metadata } from "@uesio/constants"

class BuilderAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<StoreAction>

	useNodeState = useBuilderNodeState
	useSelectedNode = useBuilderSelectedNode
	useMode = useBuilderMode
	useDragNode = useBuilderDragNode
	useDropNode = useBuilderDropNode
	useLeftPanel = useBuilderLeftPanel
	useRightPanel = useBuilderRightPanel
	useView = useBuilderView
	useHasChanges = useBuilderHasChanges

	useMetadataList = useBuilderMetadataList
	useAvailableNamespaces = useBuilderAvailableNamespaces

	setActiveNode(path: string): void {
		this.dispatcher({
			type: BAND,
			band: BUILDER_BAND,
			name: SET_ACTIVE_NODE,
			data: {
				path,
			},
		})
	}

	setSelectedNode(path: string): void {
		this.dispatcher({
			type: BAND,
			band: BUILDER_BAND,
			name: SET_SELECTED_NODE,
			data: {
				path,
			},
		})
	}

	setDragNode(path: string): void {
		this.dispatcher({
			type: BAND,
			band: BUILDER_BAND,
			name: SET_DRAG_NODE,
			data: {
				path,
			},
		})
	}

	setDropNode(path: string): void {
		this.dispatcher({
			type: BAND,
			band: BUILDER_BAND,
			name: SET_DROP_NODE,
			data: {
				path,
			},
		})
	}

	setRightPanel(panel: string): void {
		this.dispatcher({
			type: BAND,
			band: BUILDER_BAND,
			name: SET_RIGHT_PANEL,
			data: {
				panel,
			},
		})
	}

	setLeftPanel(panel: string): void {
		this.dispatcher({
			type: BAND,
			band: BUILDER_BAND,
			name: SET_LEFT_PANEL,
			data: {
				panel,
			},
		})
	}

	setView(view: string): void {
		this.dispatcher({
			type: BAND,
			band: BUILDER_BAND,
			name: SET_VIEW,
			data: {
				view,
			},
		})
	}

	toggleBuildMode(): void {
		this.dispatcher({
			type: BAND,
			band: BUILDER_BAND,
			name: TOGGLE_BUILD_MODE,
			data: {},
		})
	}

	save(): DispatchReturn {
		return this.uesio.signal.run(
			{
				band: VIEWDEF_BAND,
				signal: SAVE,
			},
			new Context()
		)
	}

	cancel(): DispatchReturn {
		return this.uesio.signal.run(
			{
				band: VIEWDEF_BAND,
				signal: CANCEL,
			},
			new Context()
		)
	}

	getMetadataList(
		context: Context,
		metadataType: metadata.MetadataType,
		namespace: string,
		grouping?: string
	): DispatchReturn {
		return this.uesio.signal.run(
			{
				band: BUILDER_BAND,
				signal: GET_METADATA_LIST,
				namespace,
				metadataType,
				grouping,
			},
			context
		)
	}

	getAvailableNamespaces(context: Context): DispatchReturn {
		return this.uesio.signal.run(
			{
				band: BUILDER_BAND,
				signal: GET_AVAILABLE_NAMESPACES,
			},
			context
		)
	}

	getSignalProperties(signal: SignalDefinition): PropDescriptor[] {
		const bandSelect: PropDescriptor[] = [
			{
				name: "band",
				type: "SELECT",
				label: "Band",
				options: [
					{
						value: "wire",
						label: "Wire",
					},
					{
						value: "component",
						label: "Component",
					},
				],
			},
		]

		const bandName = signal.band
		const band = getBand(bandName)

		if (!band) {
			return bandSelect
		}

		return bandSelect.concat(band.getSignalProps(signal))
	}
}

export { BuilderAPI }
