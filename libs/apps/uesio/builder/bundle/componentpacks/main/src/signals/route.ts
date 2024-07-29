import { api, metadata, param, wire, signal } from "@uesio/ui"
import { SignalBandDefinition, SignalDescriptor } from "../api/signalsapi"
import {
	ComponentProperty,
	StructProperty,
} from "../properties/componentproperty"

// The key for the entire band
const BAND = "route"

type RouteSignal = signal.SignalDefinition & {
	newtab?: boolean
}

interface RouteNavigateSignal extends RouteSignal {
	route: metadata.MetadataKey
	params?: Record<string, string>
}

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
		[`${BAND}/RELOAD`]: {
			label: "Reload current route",
			description: "Reloads the current route",
			properties: () => [],
		},
		[`${BAND}/NAVIGATE_TO_ROUTE`]: {
			label: "Navigate to route",
			description: "Navigates to the requested route",
			properties: (signal: RouteNavigateSignal, context) => {
				const props = [
					{
						type: "METADATA",
						name: "route",
						metadataType: "ROUTE",
						label: "Route",
					},
				] as ComponentProperty[]
				// Fetch params for the route
				if (signal.route) {
					const [params] = api.route.useParams(context, signal.route)
					if (params && params.length) {
						props.push({
							type: "STRUCT",
							name: "params",
							label: "Parameters",
							properties: params.map(
								(paramDef: param.ParamDefinition) => {
									const { name, type, required } = paramDef
									if (type === "SELECT") {
										return {
											type: "SELECT",
											name,
											required,
											selectList: {
												name: (
													paramDef as param.SelectParam
												).selectList,
											} as wire.SelectListMetadata,
										} as ComponentProperty
									}
									if (type === "METADATA") {
										return {
											type: "TEXT",
											name,
											required,
										} as ComponentProperty
									}
									return {
										type: type === "LIST" ? "TEXT" : type,
										name,
										required,
									} as ComponentProperty
								}
							) as ComponentProperty[],
						} as StructProperty)
					}
				}
				return props
			},
		},
		[`${BAND}/NAVIGATE`]: {
			label: "Navigate to path",
			description: "Navigates to a route by path",
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
