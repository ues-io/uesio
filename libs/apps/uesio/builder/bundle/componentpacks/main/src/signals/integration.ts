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
				const [actionMetadata] = api.integration.useActionMetadata(
					context,
					signal
				)
				return [
					{
						type: "METADATA",
						metadataType: "INTEGRATIONTYPE",
						name: "integrationType",
						label: "Integration Type",
						// Clear out everything else when the integration type changes
						onChange: [
							{ field: "integration" },
							{ field: "action" },
							{ field: "params" },
						],
					},
					{
						type: "METADATA",
						metadataType: "INTEGRATION",
						groupingValue: "${integrationType}",
						name: "integration",
						label: "Integration",
						displayConditions: [
							{
								type: "hasValue",
								value: "${integrationType}",
							},
						],
						// Clear out action and params when the integration changes
						onChange: [{ field: "action" }, { field: "params" }],
					},
					{
						type: "METADATA",
						metadataType: "INTEGRATIONACTION",
						groupingValue: "${integrationType}",
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
						// Clear out params when the action changes
						onChange: [{ field: "params" }],
					},
					{
						type: "STRUCT",
						name: "params",
						label: "Parameters",
						properties: (actionMetadata?.inputs ?? []).map(
							({
								name,
								label = name,
								type,
								required,
								conditions,
							}) =>
								({
									type:
										type === "LIST" || type === "MAP"
											? "TEXT"
											: type,
									name,
									label,
									required,
									displayConditions: conditions?.map(
										({
											type = "fieldValue",
											value,
											param,
											operator = "EQUALS",
										}) => ({
											type,
											value,
											field: `params->${param}`,
											operator,
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
