import { SignalDescriptor } from "../definition/signal"
import { SignalDefinition } from "../signalexports"
import { Context } from "./context"

// The key for the entire band
const CONTEXT_BAND = "context"

type Type = "WORKSPACE" | "SITE_ADMIN"

interface ClearContextSignal extends SignalDefinition {
  type: Type
}

interface SetContextSignal extends SignalDefinition {
  type: Type
  name: string
  app: string
}

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
  [`${CONTEXT_BAND}/CLEAR`]: {
    dispatcher: (signal: ClearContextSignal, context: Context) => {
      if (signal.type === "SITE_ADMIN") {
        context = context.deleteSiteAdmin()
      } else if (signal.type === "WORKSPACE") {
        context = context.deleteWorkspace()
      }
      return context
    },
  },
  [`${CONTEXT_BAND}/SET`]: {
    dispatcher: (signal: SetContextSignal, context: Context) => {
      if (signal.type !== "SITE_ADMIN" && signal.type !== "WORKSPACE")
        throw new Error("Type not supported")

      if (signal.type === "SITE_ADMIN") {
        context = context.setSiteAdmin({
          name: context.mergeString(signal.name),
          app: context.mergeString(signal.app),
        })
      } else if (signal.type === "WORKSPACE") {
        context = context.setWorkspace({
          name: context.mergeString(signal.name),
          app: context.mergeString(signal.app),
        })
      }
      return context
    },
  },
}

export default signals
