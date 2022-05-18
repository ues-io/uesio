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
	setDefinitionContent,
	cancel,
} from "../bands/builder"
import { AnyAction } from "redux"
import builderOps from "../bands/builder/operations"
import { Dispatcher, RootState } from "../store/store"

import { PlainComponentState } from "../bands/component/types"
import { MetadataType } from "../bands/builder/types"
import {
	getFullPathParts,
	getParentPath,
	makeFullPath,
} from "../component/path"
import { Definition, DefinitionMap } from "../definition/definition"
import { useSelector } from "react-redux"

import { selectors as viewSelectors } from "../bands/viewdef"
import { PlainViewDef } from "../definition/viewdef"
import get from "lodash/get"

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
			"uesio/studio.runtime",
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
	useSelectedType = () => useSelectedType() || "viewdef"

	useSelectedItem = () => useSelectedItem() || this.uesio.getViewDefId() || ""

	useLastModifiedNode = useLastModifiedNode
	useDragNode = () => getFullPathParts(useDragNode())

	useDropNode = (): [string, string, string] =>
		getFullPathParts(useDropNode())

	useHasChanges = () =>
		useSelector(({ viewdef }: RootState) => {
			const entities = viewdef?.entities
			// Loop over view defs
			if (entities) {
				for (const defKey of Object.keys(entities)) {
					const viewDef = entities[defKey]
					if (viewDef && viewDef.content !== viewDef.original) {
						return true
					}
				}
			}
			return false
		})

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

	unSelectNode = () => {
		this.dispatcher((dispatch, getState) => {
			const selectedNode = getState().builder.selectedNode
			if (!selectedNode) return
			const newPath = getParentPath(selectedNode)
			dispatch(setSelectedNode(newPath))
		})
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

	setDefinitionContent(
		metadataType: string,
		metadataItem: string,
		content: string
	) {
		this.dispatcher(
			setDefinitionContent({
				metadataType,
				metadataItem,
				content,
			})
		)
	}

	useDefinitionContent = (metadataType: string, metadataItem: string) =>
		useSelector((state: RootState) => {
			if (metadataType === "viewdef" && metadataItem) {
				return viewSelectors.selectById(state, metadataItem)?.content
			}

			if (metadataType === "componentvariant" && metadataItem) {
				//return getComponentVariant(state, metadataItem, localPath)
			}
		})

	useDefinition = (
		metadataType: string,
		metadataItem: string,
		localPath: string
	) =>
		useSelector((state: RootState) => {
			if (metadataType === "viewdef" && metadataItem) {
				const viewDef = viewSelectors.selectById(state, metadataItem)
					?.parsed as PlainViewDef
				if (!localPath) {
					return viewDef as DefinitionMap
				}
				return get(viewDef, localPath) as DefinitionMap
			}

			if (metadataType === "componentvariant" && metadataItem) {
				//return getComponentVariant(state, metadataItem, localPath)
			}
		})

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

	useAvailableNamespaces = (
		context: Context,
		metadataType?: MetadataType
	) => {
		const namespaces = useNamespaces()
		useEffect(() => {
			if (!namespaces) {
				this.dispatcher(
					builderOps.getAvailableNamespaces({ context, metadataType })
				)
			}
		})
		return namespaces
	}
	getSignalProperties = (signal: SignalDefinition) =>
		this.uesio.signal.getProperties(signal)
}

export { BuilderAPI }
