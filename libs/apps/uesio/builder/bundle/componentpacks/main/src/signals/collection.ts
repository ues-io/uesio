import { SignalBandDefinition } from "../api/signalsapi"

// The key for the entire band
const BAND = "collection"

// Metadata for all of the signals in the band
const signals: SignalBandDefinition = {
  band: BAND,
  label: "Collections",
  signals: {
    [`${BAND}/CREATE_JOB`]: {
      label: "Create Export Job",
      description: "Create Export Job for a collection",
      properties: () => [
        {
          type: "METADATA",
          name: "collection",
          label: "Collection",
          metadata: {
            type: "COLLECTION",
          },
        },
      ],
    },
  },
}

export default signals
