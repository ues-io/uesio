import {
	useDragNode,
	useDropNode,
	useNodeState,
	useSelectedNode,
	useLastModifiedNode,
	useSelectedType,
	useSelectedItem,
} from "../bands/builder/selectors"
import { Uesio } from "./hooks"
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
	removeDefinition,
	changeDefinitionKey,
	moveDefinition,
	setDefinitionContent,
	cancel,
} from "../bands/builder"
import builderOps from "../bands/builder/operations"
import { appDispatch, RootState, getCurrentState } from "../store/store"

import { PlainComponentState } from "../bands/component/types"
import { MetadataType } from "../bands/builder/types"
import {
	fromPath,
	getFullPathParts,
	getParentPath,
	makeFullPath,
	toPath,
} from "../component/path"
import { Definition, DefinitionMap } from "../definition/definition"
import { useSelector } from "react-redux"

import { selectors as viewSelectors } from "../bands/viewdef"
import { PlainViewDef } from "../definition/viewdef"
import get from "lodash/get"
import { platform } from "../platform/platform"
import usePlatformFunc from "./useplatformfunc"
import { add } from "../bands/notification"
import { nanoid } from "nanoid"
import { useEffect, useState } from "react"
import { dispatchRouteDeps } from "../bands/route/utils"
import { loadScripts } from "./usescripts"

class BuilderAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

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

	setActiveNode = (
		metadataType: string,
		metadataItem: string,
		path: string
	) => {
		appDispatch()(
			setActiveNode(makeFullPath(metadataType, metadataItem, path))
		)
	}

	clearActiveNode = () => {
		appDispatch()(setActiveNode(""))
	}

	setSelectedNode = (
		metadataType: string,
		metadataItem: string,
		path: string
	) => {
		appDispatch()(
			setSelectedNode(makeFullPath(metadataType, metadataItem, path))
		)
	}

	unSelectNode = () => {
		appDispatch()((dispatch, getState) => {
			const selectedNode = getState().builder.selectedNode
			if (!selectedNode) return
			const newPath = getParentPath(selectedNode)
			dispatch(setSelectedNode(newPath))
		})
	}

	clearSelectedNode = () => {
		appDispatch()(setSelectedNode(""))
	}

	setDragNode = (
		metadataType: string,
		metadataItem: string,
		path: string
	) => {
		appDispatch()(
			setDragNode(makeFullPath(metadataType, metadataItem, path))
		)
	}

	clearDragNode = () => {
		appDispatch()(setDragNode(""))
	}

	setDropNode = (
		metadataType: string,
		metadataItem: string,
		path: string
	) => {
		appDispatch()(
			setDropNode(makeFullPath(metadataType, metadataItem, path))
		)
	}

	clearDropNode = () => {
		appDispatch()(setDropNode(""))
	}

	save = () =>
		appDispatch()(builderOps.save(this.uesio.getContext() || new Context()))

	cancel = () => appDispatch()(cancel())

	cloneDefinition = (path: string) => appDispatch()(cloneDefinition({ path }))

	setDefinition = (path: string, definition: Definition) =>
		appDispatch()(
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
		appDispatch()(
			addDefinition({
				path,
				definition,
				index,
				type,
			})
		)
	}

	removeDefinition(path: string) {
		appDispatch()(
			removeDefinition({
				path,
			})
		)
	}

	changeDefinitionKey(path: string, key: string) {
		const pathArray = toPath(path)
		pathArray.splice(-1, 1, key)
		const definition = this.getDefinitionFromFullPath(
			getCurrentState(),
			fromPath(pathArray)
		)

		if (definition) {
			appDispatch()(
				add({
					id: nanoid(),
					severity: "error",
					text: `"${key}" already exists.`,
				})
			)
			return
		}
		appDispatch()(
			changeDefinitionKey({
				path,
				key,
			})
		)
	}

	moveDefinition(fromPath: string, toPath: string, selectKey?: string) {
		appDispatch()(
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
		appDispatch()(
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
		useSelector((state: RootState) =>
			this.getDefinition(state, metadataType, metadataItem, localPath)
		)

	getDefinitionFromFullPath = (state: RootState, fullPath: string) => {
		const [metadataType, metadataItem, localPath] =
			getFullPathParts(fullPath)
		return this.getDefinition(state, metadataType, metadataItem, localPath)
	}

	getDefinition = (
		state: RootState,
		metadataType: string,
		metadataItem: string,
		localPath: string
	) => {
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
	}

	useMetadataList = (
		context: Context,
		metadataType: MetadataType,
		namespace: string,
		grouping?: string
	) =>
		usePlatformFunc(
			() =>
				platform.getMetadataList(
					context,
					metadataType,
					namespace,
					grouping
				),
			[metadataType, namespace, grouping]
		)

	useAvailableNamespaces = (context: Context, metadataType?: MetadataType) =>
		usePlatformFunc(
			() => platform.getAvailableNamespaces(context, metadataType),
			[metadataType]
		)

	getSignalProperties = (signal: SignalDefinition) =>
		this.uesio.signal.getProperties(signal)

	useBuilderDeps = (buildMode: boolean | undefined, context: Context) => {
		const [isLoaded, setIsLoaded] = useState<boolean | undefined>(undefined)
		useEffect(() => {
			if (!buildMode || isLoaded) return
			;(async () => {
				const response = await platform.getBuilderDeps(context)
				await loadScripts([
					platform.getComponentPackURL(
						new Context(),
						"uesio/studio",
						"main",
						false
					),
					platform.getComponentPackURL(
						new Context(),
						"uesio/studio",
						"main",
						true
					),
				])

				dispatchRouteDeps(response, appDispatch())
				setIsLoaded(true)
			})()
		}, [buildMode])
		return isLoaded
	}
}

export { BuilderAPI }
