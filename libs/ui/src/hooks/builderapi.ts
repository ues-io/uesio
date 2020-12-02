import {
	useBuilderMode,
	useBuilderDragNode,
	useBuilderDropNode,
	useBuilderView,
	useBuilderRightPanel,
	useBuilderLeftPanel,
	useBuilderMetadataList,
	useBuilderAvailableNamespaces,
} from "../bands/builder/selectors"
import { Uesio } from "./hooks"
import { Context } from "../context/context"
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
import builderOps from "../bands/builder/operations"
import { Dispatcher, DispatchReturn } from "../store/store"
import { useBuilderHasChanges } from "../bands/viewdef/selectors"
import viewDefOps from "../bands/viewdef/operations"
import { cancel as cancelViewChanges } from "../bands/viewdef"

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
		return this.uesio.signal.dispatcher(
			viewDefOps.save(this.uesio.getContext() || new Context())
		)
	}

	cancel(): void {
		this.dispatcher(cancelViewChanges())
	}

	getMetadataList(
		context: Context,
		metadataType: metadata.MetadataType,
		namespace: string,
		grouping?: string
	): DispatchReturn {
		return this.dispatcher(
			builderOps.getMetadataList(
				context,
				metadataType,
				namespace,
				grouping
			)
		)
	}

	getAvailableNamespaces(context: Context): DispatchReturn {
		return this.dispatcher(builderOps.getAvailableNamespaces(context))
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
