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
	setDefinition,
	addDefinition,
	addDefinitionPair,
	removeDefinition,
	changeDefinitionKey,
	moveDefinition,
	setYaml,
} from "../bands/builder"
import { AnyAction } from "redux"
import builderOps from "../bands/builder/operations"
import { Dispatcher, RootState } from "../store/store"
import {
	getViewDefinition,
	useBuilderHasChanges,
	useViewYAML,
} from "../bands/viewdef/selectors"
import { cancel as cancelViewChanges } from "../bands/viewdef"
import saveViewDef from "../bands/viewdef/operations/save"
import { PlainComponentState } from "../bands/component/types"
import { MetadataType } from "../bands/builder/types"
import { getFullPathParts, makeFullPath } from "../component/path"
import { Definition } from "../definition/definition"
import { useSelector } from "react-redux"
import yaml from "yaml"

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
		const [metadataType, metadataItem, localPath] = getFullPathParts(
			useSelectedNode()
		)
		if (!metadataType || !metadataItem)
			return ["viewdef", this.uesio.getViewDefId() || "", ""]
		return [metadataType, metadataItem, localPath]
	}
	useLastModifiedNode = useLastModifiedNode
	useDragNode = () => getFullPathParts(useDragNode())

	useDropNode = (): [string, string, string] =>
		getFullPathParts(useDropNode())

	useIsStructureView = () =>
		this.useBuilderState<string>("buildview") !== "content"

	useHasChanges = useBuilderHasChanges

	useSelectedYAML = (metadataType: string) => {
		// Check here for the selected item and get its yaml doc
		if (metadataType === "viewdef") {
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
			setActiveNode(makeFullPath(metadataType, metadataItem, path))
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
			setSelectedNode(makeFullPath(metadataType, metadataItem, path))
		)
	}

	clearSelectedNode = () => {
		this.dispatcher(setSelectedNode(""))
	}

	setDragNode = (
		metadataType: string,
		metadataItem: string,
		path: string
	) => {
		this.dispatcher(
			setDragNode(makeFullPath(metadataType, metadataItem, path))
		)
	}

	clearDragNode = () => {
		this.dispatcher(setDragNode(""))
	}

	setDropNode = (
		metadataType: string,
		metadataItem: string,
		path: string
	) => {
		this.dispatcher(
			setDropNode(makeFullPath(metadataType, metadataItem, path))
		)
	}

	clearDropNode = () => {
		this.dispatcher(setDropNode(""))
	}

	save = () =>
		this.uesio.signal.dispatcher(
			saveViewDef({ context: this.uesio.getContext() || new Context() })
		)

	cancel = () => {
		this.dispatcher(cancelViewChanges())
	}

	setDefinition = (path: string, definition: Definition) => {
		this.dispatcher(
			setDefinition({
				path,
				definition,
			})
		)
	}

	addDefinition(path: string, definition: Definition, index?: number) {
		this.dispatcher(
			addDefinition({
				path,
				definition,
				index,
			})
		)
	}

	addDefinitionPair(path: string, definition: Definition, key: string) {
		this.dispatcher(
			addDefinitionPair({
				path,
				definition,
				key,
			})
		)
	}

	removeDefinition(path: string) {
		this.dispatcher(
			removeDefinition({
				path,
			})
		)
	}

	changeDefinitionKey(path: string, key: string) {
		this.dispatcher(
			changeDefinitionKey({
				path,
				key,
			})
		)
	}

	moveDefinition(fromPath: string, toPath: string) {
		this.dispatcher(
			moveDefinition({
				fromPath,
				toPath,
			})
		)
	}

	setYaml(path: string, yamlDoc: yaml.Document) {
		this.dispatcher(
			setYaml({
				path,
				yaml: yamlDoc,
			})
		)
	}

	useDefinition = (path: string) => {
		const [metadataType, metadataItem, localPath] = getFullPathParts(path)
		return useSelector((state: RootState) => {
			if (metadataType === "viewdef" && metadataItem) {
				return getViewDefinition(state, metadataItem, localPath)
			}
		})
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
