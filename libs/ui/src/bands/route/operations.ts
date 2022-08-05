import { Context, newContext } from "../../context/context"
import { ThunkFunc } from "../../store/store"
import { set as setRoute, setLoading } from "."
import { setMany as setComponentPack } from "../componentpack"
import { setMany as setComponentVariant } from "../componentvariant"
import { setMany as setConfigValue } from "../configvalue"
import { setMany as setLabel } from "../label"
import { setMany as setViewDef } from "../viewdef"
import { NavigateRequest } from "../../platform/platform"
import { batch } from "react-redux"
import { MetadataState } from "../metadata/types"
import { parseKey } from "../../component/path"
import loadViewOp from "../view/operations/load"
import { loadScripts } from "../../hooks/usescripts"
import { parseRouteResponse } from "./utils"
import { EntityId } from "@reduxjs/toolkit"

type EntityMap = Record<EntityId, MetadataState>

const redirect = (context: Context, path: string, newTab?: boolean) => () => {
	const mergedPath = context.merge(path)
	if (newTab) {
		window.open(mergedPath, "_blank")
		return context
	}
	window.location.href = mergedPath
	return context
}

const getRouteUrlPrefix = (context: Context, namespace: string) => {
	const workspace = context.getWorkspace()
	if (workspace && workspace.app && workspace.name) {
		return `/workspace/${workspace.app}/${workspace.name}/app/${namespace}/`
	}
	const site = context.getSite()
	if (site && site.app && site.app !== namespace) {
		return `/site/app/${namespace}/`
	}
	return "/"
}

const navigate =
	(
		context: Context,
		request: NavigateRequest,
		noPushState?: boolean
	): ThunkFunc =>
	async (dispatch, getState, platform) => {
		dispatch(setLoading())

		const workspace = context.getWorkspace()

		const routeResponse = await platform.getRoute(context, request)

		if (!routeResponse) return context

		const deps = routeResponse.dependencies

		parseRouteResponse(deps)
		const view = routeResponse.view

		if (!noPushState) {
			const prefix = getRouteUrlPrefix(context, routeResponse.namespace)
			window.history.pushState(
				{
					namespace: routeResponse.namespace,
					path: routeResponse.path,
					workspace,
				},
				"",
				prefix + routeResponse.path
			)
		}

		// Dispatch the view first so we can preload it
		if (deps?.viewdef) {
			dispatch(setViewDef(deps?.viewdef.entities as EntityMap))
		}

		const newPacks = deps?.componentpack?.ids.map((key) => {
			const [namespace, name] = parseKey(key as string)
			return platform.getComponentPackURL(context, namespace, name, false)
		})

		if (newPacks && newPacks.length) {
			await loadScripts(newPacks)
		}

		// Pre-load the view for faster appearances and no white flash
		await dispatch(
			loadViewOp(
				newContext({
					view: `${view}()`,
					viewDef: view,
					workspace,
					params: routeResponse.params,
				})
			)
		)

		batch(() => {
			if (deps?.componentpack) {
				dispatch(
					setComponentPack(deps?.componentpack.entities as EntityMap)
				)
			}
			if (deps?.configvalue) {
				dispatch(
					setConfigValue(deps?.configvalue.entities as EntityMap)
				)
			}

			if (deps?.label) {
				dispatch(setLabel(deps?.label.entities as EntityMap))
			}

			if (deps?.componentvariant) {
				dispatch(
					setComponentVariant(
						deps?.componentvariant.entities as EntityMap
					)
				)
			}
			// We don't need to store the dependencies in redux
			delete routeResponse.dependencies
			dispatch(setRoute(routeResponse))
		})

		return context
	}

export default {
	redirect,
	navigate,
}
