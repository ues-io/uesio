import {
	useDragNode,
	useDropNode,
	useMetadataList,
	useNamespaces,
	useNodeState,
	useSelectedNode,
	useLastModifiedNode,
} from "../bands/builder/selectors"
import { Uesio } from "./hooks"
import { useEffect } from "react"
import { Context } from "../context/context"
import { SignalDefinition } from "../definition/signal"
import {
	setActiveNode,
	setDragNode,
	setDropNode,
	setSelectedNode,
} from "../bands/builder"
import { AnyAction } from "redux"
import builderOps from "../bands/builder/operations"
import { Dispatcher } from "../store/store"
import { useBuilderHasChanges, useViewYAML } from "../bands/viewdef/selectors"
import { cancel as cancelViewChanges } from "../bands/viewdef"
import saveViewDef from "../bands/viewdef/operations/save"
import { PlainComponentState } from "../bands/component/types"
import { MetadataType } from "../bands/builder/types"
import { fromPath, toPath } from "../component/path"

class BuilderAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<AnyAction>

	useBuilderState = <T extends PlainComponentState>(scope: string) =>
		this.uesio.component.useExternalState<T>(
			"$root",
			"uesio.runtime",
			scope
		)

	useNodeState = useNodeState
	useSelectedNode = (): [string, string, string] => {
		const path = useSelectedNode()
		const pathArray = toPath(path)
		const metadataType = pathArray.shift() || ""
		const metadataItem = pathArray.shift() || ""
		return [metadataType, metadataItem, fromPath(pathArray)]
	}
	useLastModifiedNode = useLastModifiedNode
	useDragNode = useDragNode
	useDropNode = useDropNode
	useIsStructureView = () =>
		this.useBuilderState<string>("buildview") !== "content"

	useHasChanges = useBuilderHasChanges

	useSelectedYAML = (metadataType: string) => {
		// Check here for the selected item and get its yaml doc
		if (metadataType === "viewdef" || !metadataType) {
			const viewDefId = this.uesio.getViewDefId()
			return viewDefId ? useViewYAML(viewDefId) : undefined
		}
		return
	}

	setActiveNode = (
		metadataType: string,
		metadataItem: string,
		path: string
	) => {
		this.dispatcher(
			setActiveNode(`["${metadataType}"]["${metadataItem}"]${path}`)
		)
	}

	clearActiveNode = () => {
		this.dispatcher(setActiveNode(""))
	}

	setSelectedNode = (
		metadataType: string,
		metadataItem: string,
		path: string
	) => {
		this.dispatcher(
			setSelectedNode(`["${metadataType}"]["${metadataItem}"]${path}`)
		)
	}

	clearSelectedNode = () => {
		this.dispatcher(setSelectedNode(""))
	}

	setDragNode = (path: string) => {
		this.dispatcher(setDragNode(path))
	}

	setDropNode = (path: string) => {
		this.dispatcher(setDropNode(path))
	}

	save = () =>
		this.uesio.signal.dispatcher(
			saveViewDef({ context: this.uesio.getContext() || new Context() })
		)

	cancel = () => {
		this.dispatcher(cancelViewChanges())
	}

	useMetadataList = (
		context: Context,
		metadataType: MetadataType,
		namespace: string,
		grouping?: string
	) => {
		const metadata = useMetadataList(metadataType, namespace, grouping)
		useEffect(() => {
			if (!metadata && metadataType && namespace) {
				this.dispatcher(
					builderOps.getMetadataList({
						context,
						metadataType,
						namespace,
						grouping,
					})
				)
			}
		})
		return metadata
	}

	useAvailableNamespaces = (context: Context) => {
		const namespaces = useNamespaces()
		useEffect(() => {
			if (!namespaces) {
				this.dispatcher(builderOps.getAvailableNamespaces(context))
			}
		})
		return namespaces
	}
	getSignalProperties = (signal: SignalDefinition) =>
		this.uesio.signal.getProperties(signal)
}

export { BuilderAPI }
