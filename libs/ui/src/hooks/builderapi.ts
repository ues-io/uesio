import {
	useDragNode as useDrgNode,
	useDropNode as useDrpNode,
	useNodeState,
	useSelectedNode as useSN,
	useLastModifiedNode,
	useSelectedType as useST,
	useSelectedItem as useSI,
} from "../bands/builder/selectors"

import componentSignal from "../bands/component/signals"

import { Context } from "../context/context"
import { SignalDefinition } from "../definition/signal"
import {
	setActiveNode as setAN,
	setDragNode as setDrgN,
	setDropNode as setDrpN,
	setSelectedNode as setSN,
	cloneDefinition as cloneDef,
	setDefinition as setDef,
	addDefinition as addDef,
	removeDefinition as removeDef,
	changeDefinitionKey as changeDefKey,
	moveDefinition as moveDef,
	setDefinitionContent as setDefContent,
	cloneKeyDefinition as cloneKeyDef,
} from "../bands/builder"
import { save, cancel } from "../bands/builder/operations"
import { dispatch, RootState, getCurrentState } from "../store/store"

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
import { nanoid } from "@reduxjs/toolkit"
import { useEffect, useState } from "react"
import { dispatchRouteDeps, getPackUrlsForDeps } from "../bands/route/utils"
import { loadScripts } from "./usescripts"
import { registry } from "../signals/signals"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { addBlankSelectOption } from "../bands/field/utils"

const useSelectedNode = (): [string, string, string] => {
	const [metadataType, metadataItem, localPath] = getFullPathParts(useSN())
	if (!metadataType || !metadataItem) return ["viewdef", "", ""]
	return [metadataType, metadataItem, localPath]
}

const useSelectedType = () => useST() || "viewdef"

const useSelectedItem = () => useSI() || ""

const useDragNode = () => getFullPathParts(useDrgNode())

const useDropNode = (): [string, string, string] =>
	getFullPathParts(useDrpNode())

const useHasChanges = () =>
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

const setActiveNode = (
	metadataType: string,
	metadataItem: string,
	path: string
) => {
	dispatch(setAN(makeFullPath(metadataType, metadataItem, path)))
}

const clearActiveNode = () => {
	dispatch(setAN(""))
}

const setSelectedNode = (
	metadataType: string,
	metadataItem: string,
	path: string
) => {
	dispatch(setSN(makeFullPath(metadataType, metadataItem, path)))
}

const unSelectNode = () => {
	const selectedNode = getCurrentState().builder.selectedNode
	if (!selectedNode) return
	const newPath = getParentPath(selectedNode)
	dispatch(setSN(newPath))
}

const clearSelectedNode = () => {
	dispatch(setSN(""))
}

const setDragNode = (
	metadataType: string,
	metadataItem: string,
	path: string
) => {
	dispatch(setDrgN(makeFullPath(metadataType, metadataItem, path)))
}

const clearDragNode = () => {
	dispatch(setDrgN(""))
}

const setDropNode = (
	metadataType: string,
	metadataItem: string,
	path: string
) => {
	dispatch(setDrpN(makeFullPath(metadataType, metadataItem, path)))
}

const clearDropNode = () => {
	dispatch(setDrpN(""))
}

const cloneDefinition = (path: string) => dispatch(cloneDef({ path }))

const cloneKeyDefinition = (path: string) => {
	const newKey =
		(getKeyAtPath(path) || "") + (Math.floor(Math.random() * 60) + 1)
	dispatch(cloneKeyDef({ path, newKey }))
}

const setDefinition = (
	path: string,
	definition: Definition,
	autoSelect?: boolean
) => dispatch(setDef({ path, definition, autoSelect }))

const addDefinition = (
	path: string,
	definition: Definition,
	index?: number,
	type?: string
) => {
	dispatch(
		addDef({
			path,
			definition,
			index,
			type,
		})
	)
}

const removeDefinition = (path: string) => {
	dispatch(
		removeDef({
			path,
		})
	)
}

const changeDefinitionKey = (path: string, key: string) => {
	const pathArray = toPath(path)
	pathArray.splice(-1, 1, key)
	const definition = getDefinitionFromFullPath(
		getCurrentState(),
		fromPath(pathArray)
	)

	if (definition) {
		dispatch(
			add({
				id: nanoid(),
				severity: "error",
				text: `"${key}" already exists.`,
			})
		)
		return
	}
	dispatch(
		changeDefKey({
			path,
			key,
		})
	)
}

const moveDefinition = (
	fromPath: string,
	toPath: string,
	selectKey?: string
) => {
	dispatch(
		moveDef({
			fromPath,
			toPath,
			selectKey,
		})
	)
}

const setDefinitionContent = (
	metadataType: string,
	metadataItem: string,
	content: string
) => {
	dispatch(
		setDefContent({
			metadataType,
			metadataItem,
			content,
		})
	)
}

const useDefinitionContent = (metadataType: string, metadataItem: string) =>
	useSelector(
		(state: RootState) =>
			metadataTextSelectors.selectById(
				state,
				`${metadataType}:${metadataItem}`
			)?.content
	)

const useDefinition = (
	metadataType: string,
	metadataItem: string,
	localPath: string
) =>
	useSelector((state: RootState) =>
		getDefinition(state, metadataType, metadataItem, localPath)
	)

const getDefinitionFromFullPath = (state: RootState, fullPath: string) => {
	const [metadataType, metadataItem, localPath] = getFullPathParts(fullPath)
	return getDefinition(state, metadataType, metadataItem, localPath)
}

const getNamespaceInfo = (ns: string) => {
	const namespaces = getCurrentState().builder.namespaces || {}
	return namespaces[ns]
}

const getDefinition = (
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

const useMetadataList = (
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

const useAvailableNamespaces = (
	context: Context,
	metadataType?: MetadataType
) =>
	usePlatformFunc(
		() => platform.getAvailableNamespaces(context, metadataType),
		[metadataType]
	)

const getSignalProperties = (signal: SignalDefinition) => {
	const descriptor = registry[signal?.signal] || componentSignal
	return [
		...defaultSignalProps(),
		...(descriptor.properties ? descriptor.properties(signal) : []),
	]
}

const useBuilderDeps = (buildMode: boolean | undefined, context: Context) => {
	const [isLoaded, setIsLoaded] = useState<boolean | undefined>(undefined)
	const isPreLoaded = isLoaded || !!getCurrentState().builder.namespaces
	useEffect(() => {
		if (!buildMode || isLoaded || isPreLoaded) return
		;(async () => {
			const response = await platform.getBuilderDeps(context)

			const packsToLoad = getPackUrlsForDeps(response, context, true)

			await loadScripts(packsToLoad)
			batch(() => {
				dispatchRouteDeps(response)
			})

			setIsLoaded(true)
		})()
	}, [buildMode])
	return isLoaded || isPreLoaded
}

const defaultSignalProps = (): PropDescriptor[] => {
	const signalIds = Object.keys(registry)
	return [
		{
			name: "signal",
			label: "Signal",
			type: "SELECT",
			options: addBlankSelectOption(
				signalIds.map((signal) => ({
					value: signal,
					label: registry[signal].label || signal,
					title: registry[signal].description || signal,
				}))
			),
		},
	]
}

export {
	useNodeState,
	useSelectedNode,
	useSelectedType,
	useSelectedItem,
	useLastModifiedNode,
	useDragNode,
	useDropNode,
	useHasChanges,
	setActiveNode,
	clearActiveNode,
	setSelectedNode,
	unSelectNode,
	clearSelectedNode,
	setDragNode,
	clearDragNode,
	setDropNode,
	clearDropNode,
	save,
	cancel,
	cloneDefinition,
	cloneKeyDefinition,
	setDefinition,
	addDefinition,
	removeDefinition,
	changeDefinitionKey,
	moveDefinition,
	setDefinitionContent,
	useDefinitionContent,
	useDefinition,
	useMetadataList,
	getNamespaceInfo,
	useAvailableNamespaces,
	getSignalProperties,
	useBuilderDeps,
}
