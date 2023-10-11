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
				{
					type: "CHECKBOX",
					name: "newtab",
					label: "Open in new tab",
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
			description: "Changes the route based on the path provided",
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
			],
		},
		[`${BAND}/NAVIGATE_TO_ASSIGNMENT`]: {
			label: "Navigate to route assignment",
			description:
				"Changes the route returned by the specified route assignment",
			properties: () => [
				{
					type: "METADATA",
					name: "collection",
					metadataType: "COLLECTION",
					label: "Collection",
				},
				{
					type: "SELECT",
					name: "viewtype",
					label: "View Type",
					options: [
						{
							value: "list",
							label: "List View",
						},
						{
							value: "detail",
							label: "Detail View",
						},
					],
				},
				{
					type: "TEXT",
					name: "recordid",
					label: "Record ID",
					displayConditions: [
						{
							field: "viewtype",
							value: "detail",
						},
					],
				},
			],
		},
	} as Record<string, SignalDescriptor>,
}

export default signals
