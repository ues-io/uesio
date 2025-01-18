import {
  SignalDefinition,
  ComponentSignalDescriptor,
  SignalDescriptor,
} from "./definition/signal"

import {
  getSignal,
  getSignals,
  getComponentSignalDefinition,
} from "./hooks/signalapi"

export { getSignals, getSignal, getComponentSignalDefinition }

export type { ComponentSignalDescriptor, SignalDefinition, SignalDescriptor }
