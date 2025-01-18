import { context, signal } from "@uesio/ui"
import { SignalBandDefinition } from "../api/signalsapi"
import { getAvailablePanelIds } from "../api/panelapi"
import { ComponentProperty } from "../properties/componentproperty"

// The key for the entire band
const BAND = "panel"

const getPanelSelectOptions = (context: context.Context) =>
  getAvailablePanelIds(context)?.map((panelId) => ({
    label: panelId,
    value: panelId,
  }))

const getPanelSelectProperties = (
  signal: signal.SignalDefinition,
  context: context.Context,
): ComponentProperty[] => [
  {
    type: "SELECT",
    name: "panel",
    label: "Panel",
    blankOptionLabel: "",
    options: getPanelSelectOptions(context),
  },
]

// Metadata for all of the signals in the band
const signals: SignalBandDefinition = {
  band: BAND,
  label: "Panels",
  signals: {
    [`${BAND}/TOGGLE`]: {
      label: "Toggle panel visibility",
      description: "Toggle panel visibility",
      properties: getPanelSelectProperties,
    },
    [`${BAND}/OPEN`]: {
      label: "Open panel",
      description: "Open panel",
      properties: getPanelSelectProperties,
    },
    [`${BAND}/CLOSE`]: {
      label: "Close panel",
      description: "Close panel",
      properties: getPanelSelectProperties,
    },
    [`${BAND}/CLOSE_ALL`]: {
      label: "Close all panels",
      description: "Close all panels",
      properties: () => [],
    },
  },
}

export default signals
