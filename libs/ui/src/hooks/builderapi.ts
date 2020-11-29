import {
	useBuilderMode,
	useBuilderDragNode,
	useBuilderDropNode,
	useBuilderView,
	useBuilderRightPanel,
	useBuilderLeftPanel,
	useBuilderHasChanges,
	useBuilderMetadataList,
	useBuilderAvailableNamespaces,
} from "../bands/builder/selectors"
import { Uesio } from "./hooks"
import { Context } from "../context/context"
import { VIEWDEF_BAND } from "../viewdef/viewdefband"
import { SAVE, CANCEL } from "../viewdef/viewdefbandsignals"
import { SignalDefinition } from "../definition/signal"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { getBand } from "../actor/band"
import { metadata } from "@uesio/constants"
import {
	setActiveNode,
	setDragNode,
	setDropNode,
	setLeftPanel,
	setRightPanel,
	setSelectedNode,
	setView,
	toggleBuildMode,
} from "../bands/builder"
import { AnyAction } from "redux"
import {
	useBuilderNodeState,
	useBuilderSelectedNode,
} from "../bands/builder/selectors"
import {
	getAvailableNamespacesSignal,
	getMetadataListSignal,
} from "../bands/builder/signals"
import { Dispatcher, DispatchReturn } from "../store/store"

class BuilderAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<AnyAction>

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
		this.dispatcher(setActiveNode(path))
	}

	setSelectedNode(path: string): void {
		this.dispatcher(setSelectedNode(path))
	}

	setDragNode(path: string): void {
		this.dispatcher(setDragNode(path))
	}

	setDropNode(path: string): void {
		this.dispatcher(setDropNode(path))
	}

	setRightPanel(panel: string): void {
		this.dispatcher(setRightPanel(panel))
	}

	setLeftPanel(panel: string): void {
		this.dispatcher(setLeftPanel(panel))
	}

	setView(view: string): void {
		this.dispatcher(setView(view))
	}

	toggleBuildMode(): void {
		this.dispatcher(toggleBuildMode())
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
			getMetadataListSignal(metadataType, namespace, grouping),
			context
		)
	}

	getAvailableNamespaces(context: Context): DispatchReturn {
		return this.uesio.signal.run(getAvailableNamespacesSignal(), context)
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
