import {
  SignalDefinition,
  ComponentSignalDescriptor,
  ComponentSignalDispatcher,
  SignalDescriptor,
} from "./definition/signal"

import {
  getSignal,
  getSignals,
  getComponentSignalDefinition,
} from "./hooks/signalapi"

export { getSignals, getSignal, getComponentSignalDefinition }

export type {
  ComponentSignalDescriptor,
  ComponentSignalDispatcher,
  SignalDefinition,
  SignalDescriptor,
}
