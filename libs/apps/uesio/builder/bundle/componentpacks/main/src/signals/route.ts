import { SignalBandDefinition, SignalDescriptor } from "../api/signalsapi"

// The key for the entire band
const BAND = "route"

// Metadata for all of the signals in the band
const signals: SignalBandDefinition = {
	band: BAND,
	label: "Routes",
	signals: {
		[`${BAND}/REDIRECT`]: {
			label: "Redirect to route",
			description: "Route redirect",
			properties: () => [
				{
					type: "TEXT",
					name: "path",
					label: "Path",
				},
			],
		},
		[`${BAND}/REDIRECT_TO_VIEW_CONFIG`]: {
			label: "Redirect to View Config",
			description: "Redirect to View Config",
			properties: () => [],
		},
		[`${BAND}/RELOAD`]: {
			label: "Reload current route",
			description: "Reloads the current route",
			properties: () => [],
		},
		[`${BAND}/NAVIGATE`]: {
			label: "Navigate to route",
			description: "Changes the route without reloading the browser",
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
	} as Record<string, SignalDescriptor>,
}

export default signals
