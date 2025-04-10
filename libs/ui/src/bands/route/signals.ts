import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import {
  AssignmentNavigateRequest,
  PathNavigateRequest,
  RouteNavigateRequest,
} from "../../platform/platform"
import { getCurrentState } from "../../store/store"
import {
  navigate,
  navigateToAssignment,
  navigateToRoute,
  redirect,
} from "./operations"

// The key for the entire band
const ROUTE_BAND = "route"

type RouteSignal = SignalDefinition & {
  newtab?: boolean
  preventLinkTag?: boolean
}

interface RedirectSignal extends RouteSignal {
  signal: "route/REDIRECT"
  path: string
}

type PathNavigateSignal = RouteSignal &
  PathNavigateRequest & {
    signal: "route/NAVIGATE"
  }

type RouteNavigateSignal = RouteSignal &
  RouteNavigateRequest & {
    signal: "route/NAVIGATE_TO_ROUTE"
  }

type AssignmentNavigateSignal = RouteSignal &
  AssignmentNavigateRequest & {
    signal: "route/NAVIGATE_TO_ASSIGNMENT"
  }

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
  [`${ROUTE_BAND}/REDIRECT`]: {
    dispatcher: (signal: RedirectSignal, context: Context) =>
      redirect(
        context,
        context.mergeString(signal.path),
        context.mergeBoolean(signal.newtab, false),
      ),
  },
  [`${ROUTE_BAND}/RELOAD`]: {
    dispatcher: (signal: SignalDefinition, context: Context) => {
      const routeState = getCurrentState().route
      if (!routeState) return context
      const { namespace, path } = routeState
      return navigate(context, {
        namespace,
        path,
      })
    },
  },
  [`${ROUTE_BAND}/NAVIGATE`]: {
    dispatcher: (signal: PathNavigateSignal, context: Context) =>
      navigate(context, context.mergeMap(signal)),
  },
  [`${ROUTE_BAND}/NAVIGATE_TO_ROUTE`]: {
    dispatcher: (signal: RouteNavigateSignal, context: Context) =>
      navigateToRoute(context, context.mergeMap(signal)),
  },
  [`${ROUTE_BAND}/NAVIGATE_TO_ASSIGNMENT`]: {
    dispatcher: (signal: AssignmentNavigateSignal, context: Context) =>
      navigateToAssignment(context, context.mergeMap(signal)),
  },
}

export type {
  PathNavigateSignal,
  RouteNavigateSignal,
  AssignmentNavigateSignal,
  RedirectSignal,
}

export default signals
