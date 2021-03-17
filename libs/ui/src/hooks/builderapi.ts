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
import { metadata } from "@uesio/constants"
import {
	setActiveNode,
	setDragNode,
	setDropNode,
	setSelectedNode,
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
	useDragNode = useDragNode
	useDropNode = useDropNode
	useIsStructureView = () =>
		this.uesio.component.useExternalState<string>(
			"$root",
			"uesio.runtime",
			"buildview"
		) !== "content"

	useHasChanges = useBuilderHasChanges

	useMetadataList = useMetadataList

	setActiveNode = (path: string) => {
		this.dispatcher(setActiveNode(path))
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

	useAvailableNamespaces = (context: Context) => {
		const namespaces = useNamespaces()
		useEffect(() => {
			if (!namespaces) {
				this.getAvailableNamespaces(context)
			}
		})
		return namespaces
	}
	getSignalProperties = (signal: SignalDefinition) =>
		this.uesio.signal.getProperties(signal)
}

export { BuilderAPI }
