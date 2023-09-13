import { Context } from "../context/context"
import { RootState, getCurrentState } from "../store/store"
import * as api from "../api/api"

import { MetadataType } from "../metadata/types"
import { Definition } from "../definition/definition"
import { batch, useSelector } from "react-redux"

import { selectors as viewSelectors } from "../bands/viewdef"
import get from "lodash/get"
import { platform } from "../platform/platform"
import usePlatformFunc from "./useplatformfunc"
import { dispatchRouteDeps, getPackUrlsForDeps } from "../bands/route/utils"
import { loadScripts } from "./usescripts"
import { makeComponentId } from "./componentapi"

const useDefinition = (
	metadataType: string,
	metadataItem: string,
	localPath: string
) =>
	useSelector((state: RootState) =>
		getDefinition(state, metadataType, metadataItem, localPath)
	)

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

const getDefinitionAtPath = (
	metadataType: string,
	metadataItem: string,
	localPath: string
) => getDefinition(getCurrentState(), metadataType, metadataItem, localPath)

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

export {
	useDefinition,
	useMetadataList,
	useAvailableNamespaces,
	getBuilderDeps,
	getDefinitionAtPath,
}
