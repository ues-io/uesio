import { SignalDescriptor } from "../definition/signal"
import { SignalDefinition } from "../signalexports"
import { Context } from "./context"

// The key for the entire band
const CONTEXT_BAND = "context"

interface ClearWorkspaceContextSignal extends SignalDefinition {
  type: "WORKSPACE"
}

interface ClearSiteAdminContextSignal extends SignalDefinition {
  type: "SITE_ADMIN"
}

interface ClearViewContextSignal extends SignalDefinition {
  type: "VIEW"
  viewDef: string
}

type ClearContextSignal =
  | ClearWorkspaceContextSignal
  | ClearSiteAdminContextSignal
  | ClearViewContextSignal

interface SetWorkspaceContextSignal extends SignalDefinition {
  type: "WORKSPACE"
  name: string
  app: string
}

interface SetSiteAdminContextSignal extends SignalDefinition {
  type: "SITE_ADMIN"
  name: string
  app: string
}

type SetContextSignal = SetWorkspaceContextSignal | SetSiteAdminContextSignal

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
  [`${CONTEXT_BAND}/CLEAR`]: {
    dispatcher: (signal: ClearContextSignal, context: Context) => {
      if (signal.type === "SITE_ADMIN") {
        context = context.deleteSiteAdmin()
      } else if (signal.type === "WORKSPACE") {
        context = context.deleteWorkspace()
      } else if (signal.type === "VIEW") {
        // If the signal included a viewDef, only remove if the topmost
        // view in the stack is defined by that viewDef. If no viewDef
        // is provided, always remove the view frame.
        if (signal.viewDef) {
          context = context.removeViewFrameById(signal.viewDef)
        } else {
          context = context.removeViewFrame(1)
        }
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
