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
	cloneKeyDefinition,
} from "../bands/builder"
import { save as saveOp, cancel as cancelOp } from "../bands/builder/operations"
import { appDispatch, RootState, getCurrentState } from "../store/store"

import { MetadataType } from "../bands/builder/types"
import {
	fromPath,
	getFullPathParts,
	getKeyAtPath,
	getParentPath,
	makeFullPath,
	toPath,
} from "../component/path"
import { Definition, DefinitionMap } from "../definition/definition"
import { batch, useSelector } from "react-redux"

import { selectors as viewSelectors } from "../bands/viewdef"
import { selectors as metadataTextSelectors } from "../bands/metadatatext"
import get from "lodash/get"
import { platform } from "../platform/platform"
import usePlatformFunc from "./useplatformfunc"
import { add } from "../bands/notification"
import { nanoid } from "nanoid"
import { useEffect, useState } from "react"
import {
	dispatchRouteDeps,
	getPackUrls,
	getPackUrlsForDeps,
} from "../bands/route/utils"
import { loadScripts } from "./usescripts"

class BuilderAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

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
		useSelector(({ metadatatext }: RootState) => {
			const entities = metadatatext?.entities
			if (entities) {
				for (const defKey of Object.keys(entities)) {
					const entity = entities[defKey]
					if (
						entity &&
						entity.original &&
						entity.content !== entity.original
					) {
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

	save = () => appDispatch()(saveOp(this.uesio.getContext() || new Context()))

	cancel = () =>
		appDispatch()(cancelOp(this.uesio.getContext() || new Context()))

	cloneDefinition = (path: string) => appDispatch()(cloneDefinition({ path }))

	cloneKeyDefinition = (path: string) => {
		const newKey =
			(getKeyAtPath(path) || "") + (Math.floor(Math.random() * 60) + 1)
		appDispatch()(cloneKeyDefinition({ path, newKey }))
	}

	setDefinition = (path: string, definition: Definition) =>
		appDispatch()(setDefinition({ path, definition }))

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
		useSelector(
			(state: RootState) =>
				metadataTextSelectors.selectById(
					state,
					`${metadataType}:${metadataItem}`
				)?.content
		)

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

	getNamespaceInfo = (ns: string) => {
		const namespaces = getCurrentState().builder.namespaces || {}
		return namespaces[ns]
	}

	getDefinition = (
		state: RootState,
		metadataType: string,
		metadataItem: string,
		localPath: string
	) => {
		if (metadataType === "viewdef" && metadataItem) {
			const viewDef = viewSelectors.selectById(
				state,
				metadataItem
			)?.definition
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

				const packsToLoad = getPackUrlsForDeps(response, context, true)
				const studioPacks = getPackUrls(
					"uesio/studio.main",
					new Context(),
					true
				)

				await loadScripts([...packsToLoad, ...studioPacks])
				batch(() => {
					dispatchRouteDeps(response, appDispatch())
				})

				setIsLoaded(true)
			})()
		}, [buildMode])
		return isLoaded
	}
}

export { BuilderAPI }
