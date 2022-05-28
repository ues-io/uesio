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
		properties: () => [
			{
				type: "TEXT",
				name: "path",
				label: "Path",
			},
		],
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
		properties: () => [],
	},
	[`${ROUTE_BAND}/NAVIGATE`]: {
		dispatcher: (signal: NavigateSignal, context: Context) =>
			operations.navigate(context, signal),
		label: "Navigate",
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
