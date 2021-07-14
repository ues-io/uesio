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
import { useBuilderHasChanges } from "../bands/viewdef/selectors"
import { cancel as cancelViewChanges } from "../bands/viewdef"
import saveViewDef from "../bands/viewdef/operations/save"
import { PlainComponentState } from "../bands/component/types"
import { MetadataType } from "../bands/builder/types"

// type ViewNode = {
// 	key: 'view'
// 	fullname: string
// 	path: string
// }
// type ThemeNode = {
// 	key: 'theme'
// 	fullname: string
// }
// type VariantNode = {
// 	key: 'variant'
// 	fullname: string
// }
// type InputNode = VariantNode | ThemeNode | ViewNode

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
	useSelectedNode = useSelectedNode
	useLastModifiedNode = useLastModifiedNode
	useDragNode = useDragNode
	useDropNode = useDropNode
	useIsStructureView = () =>
		this.useBuilderState<string>("buildview") !== "content"

	useHasChanges = useBuilderHasChanges

	setActiveNode = (path: string) => {
		this.dispatcher(setActiveNode(path))
	}

	// WIP
	// setActiveNode = ({ key = "", fullname = "", path = "" }) => {
	// 	const node = `[${key}][${fullname}]` + path ? `[${path}]` : ""
	// 	return this.dispatcher(setActiveNode(node))
	// }

	setSelectedNode = (path: string) => {
		this.dispatcher(setSelectedNode(path))
	}

	// Todo : add clearSelectedNode
	// TODO: update existing setSelected node with empty string
	clearSetSelectedNode = () => {
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
		console.log("HERE", metadata, metadataType, namespace)
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
