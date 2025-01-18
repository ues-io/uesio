import { SignalBandDefinition } from "../api/signalsapi"

// The key for the entire band
const BAND = "context"

// Metadata for all of the signals in the band
const signals: SignalBandDefinition = {
  band: BAND,
  label: "Routes",
  signals: {
    [`${BAND}/CLEAR`]: {
      label: "Clear",
      description: "Clear context",
      properties: () => [
        {
          type: "TEXT",
          name: "type",
          label: "Type",
        },
      ],
    },
    [`${BAND}/SET`]: {
      label: "Set",
      description: "Set context",
      properties: () => [
        {
          type: "TEXT",
          name: "type",
          label: "Type",
        },
      ],
    },
  },
}

export default signals
