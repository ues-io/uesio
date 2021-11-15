import {
	useDragNode,
	useDropNode,
	useMetadataList,
	useNamespaces,
	useNodeState,
	useSelectedNode,
	useLastModifiedNode,
	useSelectedType,
	useSelectedItem,
	useSelectedYAML,
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
	cloneDefinition,
	setDefinition,
	addDefinition,
	addDefinitionPair,
	removeDefinition,
	changeDefinitionKey,
	moveDefinition,
	setYaml,
	cancel,
} from "../bands/builder"
import { AnyAction } from "redux"
import builderOps from "../bands/builder/operations"
import { Dispatcher, RootState } from "../store/store"
import {
	getViewDefinition,
	useBuilderHasChanges,
} from "../bands/viewdef/selectors"
import { getComponentVariant } from "../bands/componentvariant/selectors"
import { PlainComponentState } from "../bands/component/types"
import { MetadataType } from "../bands/builder/types"
import { getFullPathParts, makeFullPath } from "../component/path"
import { Definition, YamlDoc } from "../definition/definition"
import { useSelector } from "react-redux"

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
	useSelectedType = () => useSelectedType()

	useSelectedItem = () => useSelectedItem() || this.uesio.getViewDefId() || ""

	useLastModifiedNode = useLastModifiedNode
	useDragNode = () => getFullPathParts(useDragNode())

	useDropNode = (): [string, string, string] =>
		getFullPathParts(useDropNode())

	useHasChanges = useBuilderHasChanges

	useSelectedYAML = useSelectedYAML

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
		this.dispatcher(
			builderOps.save({
				context: this.uesio.getContext() || new Context(),
			})
		)

	cancel = () => this.dispatcher(cancel())

	cloneDefinition = (path: string) =>
		this.dispatcher(cloneDefinition({ path }))

	setDefinition = (path: string, definition: Definition) =>
		this.dispatcher(
			setDefinition({
				path,
				definition,
			})
		)

	addDefinition(
		path: string,
		definition: Definition,
		index?: number,
		type?: string
	) {
		this.dispatcher(
			addDefinition({
				path,
				definition,
				index,
				type,
			})
		)
	}

	addDefinitionPair(
		path: string,
		definition: Definition,
		key: string,
		type?: string
	) {
		this.dispatcher(
			addDefinitionPair({
				path,
				definition,
				key,
				type,
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

	moveDefinition(fromPath: string, toPath: string, selectKey?: string) {
		this.dispatcher(
			moveDefinition({
				fromPath,
				toPath,
				selectKey,
			})
		)
	}

	setYaml(path: string, yamlDoc: YamlDoc) {
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

			if (metadataType === "componentvariant" && metadataItem) {
				return getComponentVariant(state, metadataItem, localPath)
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
