import { Context, Mergeable } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { makeComponentId, setStateSlice } from "../../hooks/componentapi"
import { extractComponentIdFromViewId } from "../route/utils"

// The key for the entire band
const VIEW_BAND = "view"

type SetParamSignal = SignalDefinition & {
  param: string
  value: Mergeable
}

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
  [`${VIEW_BAND}/SET_PARAM`]: {
    dispatcher: (signal: SetParamSignal, context: Context) => {
      const viewId = context.getViewId()

      const userComponentId = extractComponentIdFromViewId(viewId)
      const fullComponentId = makeComponentId(
        context.removeViewFrame(1),
        "uesio/core.view",
        userComponentId,
      )
      setStateSlice(signal.param, fullComponentId, context.merge(signal.value))
      return context
    },
  },
}

export type { SetParamSignal }

export default signals
