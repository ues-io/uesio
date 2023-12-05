import {
	SignalBandDefinition,
	SignalDefinition,
	SignalDescriptor,
} from "../api/signalsapi"
import {
	ComponentProperty,
	StructProperty,
} from "../properties/componentproperty"
import { api, metadata } from "@uesio/ui"

interface RunActionSignal extends SignalDefinition {
	integrationType: metadata.MetadataKey
	integration: metadata.MetadataKey
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
				const [params] = api.integration.useActionParams(
					context,
					signal
				)
				return [
					{
						type: "METADATA",
						metadataType: "INTEGRATIONTYPE",
						name: "integrationType",
						label: "Integration Type",
					},
					{
						type: "METADATA",
						metadataType: "INTEGRATION",
						groupingValue: signal.integrationType,
						name: "integration",
						label: "Integration",
						displayConditions: [
							{
								type: "hasValue",
								value: "${integrationType}",
							},
						],
					},
					{
						type: "METADATA",
						metadataType: "INTEGRATIONACTION",
						groupingValue: signal.integrationType,
						name: "action",
						label: "Action Name",
						displayConditions: [
							{
								type: "hasValue",
								value: "${integrationType}",
							},
							{
								type: "hasValue",
								value: "${integration}",
							},
						],
					},
					{
						type: "STRUCT",
						name: "params",
						label: "Parameters",
						properties: (params ?? []).map(
							({
								name,
								label = name,
								type,
								required,
								conditions,
							}) =>
								({
									type: type === "LIST" ? "TEXT" : type,
									name,
									label,
									required,
									displayConditions: conditions?.map(
										(condition) => ({
											type: condition.type,
											value: condition.value,
											field: condition.param,
										})
									),
								} as ComponentProperty)
						) as ComponentProperty[],
						displayConditions: [
							{
								type: "hasValue",
								value: "${integrationType}",
							},
							{
								type: "hasValue",
								value: "${action}",
							},
						],
					} as StructProperty,
				] as ComponentProperty[]
			},
			canError: true,
			// TODO: Outputs could be a stream, don't require a named property in a map
			outputs: [{ name: "params", type: "MAP" }],
		},
	} as Record<string, SignalDescriptor>,
}
export default signals
