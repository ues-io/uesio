import { SignalBandDefinition } from "../api/signalsapi"
import { api, metadata, signal } from "@uesio/ui"
import { getPropertyTypeFromParamDef } from "./route"

interface RunActionSignal extends signal.SignalDefinition {
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
          signal,
        )
        return [
          {
            type: "METADATA",
            metadata: {
              type: "INTEGRATIONTYPE",
            },
            name: "integrationType",
            label: "Integration Type",
            // Clear out everything else when the integration type changes
            onChange: [
              {
                updates: [
                  { field: "integration" },
                  { field: "action" },
                  { field: "params" },
                ],
              },
            ],
          },
          {
            type: "METADATA",
            metadata: {
              type: "INTEGRATION",
              grouping: "${integrationType}",
            },
            name: "integration",
            label: "Integration",
            displayConditions: [
              {
                type: "hasValue",
                value: "${integrationType}",
              },
            ],
            // Clear out action and params when the integration changes
            onChange: [
              {
                updates: [{ field: "action" }, { field: "params" }],
              },
            ],
          },
          {
            type: "METADATA",
            metadata: {
              type: "INTEGRATIONACTION",
              grouping: "${integrationType}",
            },
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
            onChange: [
              {
                updates: [{ field: "params" }],
              },
            ],
          },
          {
            type: "STRUCT",
            name: "params",
            label: "Parameters",
            properties: (actionMetadata?.inputs ?? []).map((paramDef) => {
              const { name, label = name, required, conditions } = paramDef
              return {
                type: getPropertyTypeFromParamDef(paramDef),
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
                    value: value as string,
                    field: `params->${param}`,
                    operator,
                  }),
                ),
              }
            }),

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
          },
        ]
      },
      canError: true,
      // TODO: Outputs could be a stream, don't require a named property in a map
      outputs: [{ name: "params", type: "MAP" }],
    },
  },
}
export default signals
