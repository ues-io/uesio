import {
	SignalBandDefinition,
	SignalDefinition,
	SignalDescriptor,
} from "../api/signalsapi"
import {
	ComponentProperty,
	StructProperty,
} from "../properties/componentproperty"
import { api } from "@uesio/ui"

interface RunActionSignal extends SignalDefinition {
	integration: string
	action: string
}

// The key for the entire band
const BAND = "integration"
const signals: SignalBandDefinition = {
	band: BAND,
	label: "Integrations",
	signals: {
		[`${BAND}/RUN_ACTION`]: {
			label: "Run Integration Action",
			description: "Runs an action provided by an integration",
			properties: (signal: RunActionSignal, context) => {
				const props = [
					{
						type: "METADATA",
						metadataType: "INTEGRATION",
						name: "integration",
						label: "Integration",
					},
					{
						type: "METADATA",
						metadataType: "INTEGRATIONACTION",
						groupingValue: signal.integration,
						name: "action",
						label: "Action Name",
						displayConditions: [
							{
								type: "hasValue",
								value: "${integration}",
							},
						],
					},
				] as ComponentProperty[]
				// Fetch params for the integration action
				if (signal.integration && signal.action) {
					const [params] = api.integration.useActionParams(
						context,
						signal.integration,
						signal.action
					)
					if (params && params.length) {
						props.push({
							type: "STRUCT",
							name: "params",
							label: "Parameters",
							properties: params.map(
								({ name, type, required }) =>
									({
										type: type === "LIST" ? "TEXT" : type,
										name,
										required,
									} as ComponentProperty)
							) as ComponentProperty[],
						} as StructProperty)
					}
				}
				return props
			},
			canError: true,
			// TODO: Outputs could be a stream, don't require a named property in a map
			outputs: [{ name: "params", type: "MAP" }],
		},
	} as Record<string, SignalDescriptor>,
}
export default signals
