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
import { parse } from "../../yamlutils/yamlutils"
import { parseKey, parseVariantKey } from "../../component/path"
import loadViewOp from "../view/operations/load"
import { loadScripts } from "../../hooks/usescripts"

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
		const view = routeResponse.view

		const componentPacksToAdd: MetadataState[] = []
		const componentVariantsToAdd: MetadataState[] = []
		const viewDefToAdd: MetadataState[] = []
		const configValuesToAdd: MetadataState[] = []
		const labelsToAdd: MetadataState[] = []

		const componentVariantState =
			routeResponse.dependencies?.componentvariant
		if (componentVariantState && componentVariantState.ids?.length) {
			componentVariantState.ids.forEach((id: string) => {
				const componentVariant = componentVariantState.entities[
					id
				] as MetadataState

				const [cns, cn, ns] = parseVariantKey(id)
				componentVariant.parsed = {
					...parse(componentVariant.content).toJSON(),
					component: cns + "." + cn,
					namespace: ns,
				}

				componentVariantsToAdd.push(componentVariant)
			})
		}

		const componentPacksState = routeResponse.dependencies?.componentpack
		if (componentPacksState && componentPacksState.ids?.length) {
			componentPacksState.ids.forEach((id: string) => {
				const componentPack = componentPacksState.entities[
					id
				] as MetadataState
				componentPacksToAdd.push(componentPack)
			})
		}

		const viewDefState = routeResponse.dependencies?.viewdef
		if (viewDefState && viewDefState.ids?.length) {
			viewDefState.ids.forEach((id: string) => {
				const viewDef = viewDefState.entities[id] as MetadataState
				viewDef.original = viewDef.content
				viewDef.parsed = parse(viewDef.content).toJSON()
				viewDefToAdd.push(viewDef)
			})
		}

		const configValueState = routeResponse.dependencies?.configvalue
		if (configValueState && configValueState.ids?.length) {
			configValueState.ids.forEach((id: string) => {
				const configvalue = configValueState.entities[
					id
				] as MetadataState
				configValuesToAdd.push(configvalue)
			})
		}

		const labelState = routeResponse.dependencies?.label
		if (labelState && labelState.ids?.length) {
			labelState.ids.forEach((id: string) => {
				const label = labelState.entities[id] as MetadataState
				labelsToAdd.push(label)
			})
		}

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

		// We don't need to store the dependencies in redux
		delete routeResponse.dependencies

		dispatch(setViewDef(viewDefToAdd))
		// TODO: This can be removed once we move to React 18

		//END

		await loadScripts(
			componentPacksToAdd.map(({ key }) => {
				const [namespace, name] = parseKey(key)
				return platform.getComponentPackURL(
					context,
					namespace,
					name,
					false
				)
			})
		)

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
			dispatch(setComponentPack(componentPacksToAdd))
			dispatch(setConfigValue(configValuesToAdd))
			dispatch(setLabel(labelsToAdd))
			dispatch(setComponentVariant(componentVariantsToAdd))
			dispatch(setRoute(routeResponse))
		})

		return context
	}

export default {
	redirect,
	navigate,
}
