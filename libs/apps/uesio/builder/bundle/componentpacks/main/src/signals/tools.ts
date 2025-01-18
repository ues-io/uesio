import { SignalBandDefinition } from "../api/signalsapi"

// The key for the entire band
const BAND = "tools"
const signals: SignalBandDefinition = {
  band: BAND,
  label: "Developer Tools",
  signals: {
    [`${BAND}/MARK`]: {
      label: "Record performance marker",
      description:
        "Record current time for later use in performance measurements",
      properties: () => [
        {
          type: "TEXT",
          name: "marker",
          label: "Marker name",
        },
      ],
    },
    [`${BAND}/MEASURE`]: {
      label: "Capture performance measurement",
      description:
        "Record a performance measurement between a start marker and an optional end marker (defaulting to now), computing the elapsed time between the two.",
      properties: () => [
        {
          type: "TEXT",
          name: "measureName",
          label: "Measurement name",
        },
        {
          type: "TEXT",
          name: "startMarker",
          label: "Start marker name",
        },
        {
          type: "TEXT",
          name: "endMarker",
          label: "(optional) End marker name",
        },
        {
          type: "CHECKBOX",
          name: "logToConsole",
          label: "Log measurement results to browser console",
        },
      ],
      outputs: [{ name: "results", type: "STRUCT" }],
    },
    [`${BAND}/LOG`]: {
      label: "Log to browser console",
      description: "Log text (which may include merges) to the browser console",
      properties: () => [
        {
          type: "TEXT",
          name: "text",
          label: "Text to log to console",
        },
      ],
    },
  },
}
export default signals
