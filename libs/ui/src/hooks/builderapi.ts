import componentSignal from "../bands/component/signals"

import { Context } from "../context/context"
import { SignalDefinition } from "../definition/signal"
import {
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
import * as api from "../api/api"

import { MetadataType } from "../bands/builder/types"
import {
	fromPath,
	getFullPathParts,
	getKeyAtPath,
	toPath,
} from "../component/path"
import { Definition } from "../definition/definition"
import { batch, useSelector } from "react-redux"

import { selectors as viewSelectors } from "../bands/viewdef"
import { selectors as metadataTextSelectors } from "../bands/metadatatext"
import get from "lodash/get"
import { platform } from "../platform/platform"
import usePlatformFunc from "./useplatformfunc"
import { add } from "../bands/notification"
import { nanoid } from "@reduxjs/toolkit"
import { dispatchRouteDeps, getPackUrlsForDeps } from "../bands/route/utils"
import { loadScripts } from "./usescripts"
import { registry } from "../signals/signals"
import { PropDescriptor } from "../buildmode/buildpropdefinition"
import { addBlankSelectOption } from "../bands/field/utils"
import { makeComponentId } from "./componentapi"

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
			return viewDef as Definition
		}
		return get(viewDef, localPath) as Definition
	}

	if (metadataType === "componentvariant" && metadataItem) {
		//return getComponentVariant(state, metadataItem, localPath)
	}
}

const getDefinitionAtPath = (path: string) =>
	getDefinitionFromFullPath(getCurrentState(), path)

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

const getBuilderDeps = async (context: Context) => {
	const workspace = context.getWorkspace()
	if (!workspace || !workspace.wrapper) return

	const namespaces = api.component.getExternalState(
		makeComponentId(context, workspace?.wrapper, "namespaces")
	)

	const isLoaded = !!namespaces

	if (isLoaded) return

	const response = await platform.getBuilderDeps(context)

	const packsToLoad = getPackUrlsForDeps(response, context)

	await loadScripts(packsToLoad)
	batch(() => {
		dispatchRouteDeps(response)
	})

	return
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
	useHasChanges,
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
	useAvailableNamespaces,
	getSignalProperties,
	getBuilderDeps,
	getDefinitionAtPath,
}
