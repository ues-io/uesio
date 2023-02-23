import { SignalDescriptor } from "../api/signalsapi"

// The key for the entire band
const ROUTE_BAND = "route"

// Metadata for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
	[`${ROUTE_BAND}/REDIRECT`]: {
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
		label: "Redirect to View Config",
		description: "Redirect to View Config",
		properties: () => [],
	},
	[`${ROUTE_BAND}/RELOAD`]: {
		label: "Reload",
		description: "Reload route",
		properties: () => [],
	},
	[`${ROUTE_BAND}/NAVIGATE`]: {
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
