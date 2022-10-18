import { parseKey } from "../../component/path"
import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import {
	CollectionNavigateRequest,
	PathNavigateRequest,
} from "../../platform/platform"
import operations from "./operations"

// The key for the entire band
const ROUTE_BAND = "route"

interface RedirectSignal extends SignalDefinition {
	path: string
	newtab?: boolean
}

type PathNavigateSignal = SignalDefinition & PathNavigateRequest

type CollectionNavigateSignal = SignalDefinition & CollectionNavigateRequest

type NavigateSignal = PathNavigateSignal | CollectionNavigateSignal

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${ROUTE_BAND}/REDIRECT`]: {
		dispatcher: (signal: RedirectSignal, context: Context) =>
			operations.redirect(context, signal.path, signal.newtab),
		label: "Redirect",
		description: "Route redirect",
		properties: () => [
			{
				type: "TEXT",
				name: "path",
				label: "Path",
			},
		],
	},
	[`${ROUTE_BAND}/REDIRECT_TO_VIEW_CONFIG`]: {
		dispatcher: (signal: RedirectSignal, context: Context) => {
			const workspace = context.getWorkspace()
			const route = context.getRoute()
			if (!workspace || !route) {
				throw new Error("Not in a Workspace Context")
			}
			const [, viewName] = parseKey(route.view)
			return operations.redirect(
				context,
				`/app/${workspace.app}/workspace/${workspace.name}/views/${viewName}`
			)
		},
		label: "Redirect to View Config",
		description: "Redirect to View Config",
		properties: () => [],
	},
	[`${ROUTE_BAND}/RELOAD`]: {
		dispatcher:
			(signal: SignalDefinition, context: Context) =>
			async (dispatch, getState) => {
				const routeState = getState().route
				if (!routeState) return context
				return dispatch(
					operations.navigate(context, {
						namespace: routeState.namespace,
						path: routeState.path,
					})
				)
			},
		label: "Reload",
		description: "Reload route",
		properties: () => [],
	},
	[`${ROUTE_BAND}/NAVIGATE`]: {
		dispatcher: (signal: NavigateSignal, context: Context) =>
			operations.navigate(context, signal),
		label: "Navigate",
		description: "Navigate",
		properties: () => [
			{
				type: "TEXT",
				name: "path",
				label: "Path",
			},
			{
				type: "NAMESPACE",
				name: "namespace",
				label: "Namespace",
			},
			{
				type: "METADATA",
				name: "collection",
				metadataType: "COLLECTION",
				label: "Collection",
			},
			{
				type: "TEXT",
				name: "id",
				label: "Record ID",
			},
		],
	},
}

export default signals
