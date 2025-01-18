import type { Context, ContextOptions } from "../context/context"
import type { Definition } from "./definition"
import type { PlainComponentState } from "../bands/component/types"
import type { Draft } from "@reduxjs/toolkit"
import type { Platform } from "../platform/platform"
import {
  COMPONENT_CONTEXT,
  DisplayCondition,
  SIGNAL_CONDITIONS,
} from "../componentexports"

type SignalDispatcher = (
  signal: SignalDefinition,
  context: Context,
) => Promise<Context> | Context

type ComponentSignalDispatcher<T> = (
  state: Draft<T>,
  signal: SignalDefinition,
  context: Context,
  platform: Platform,
  id: string,
) => unknown | Context

type SignalDescriptor = {
  dispatcher: SignalDispatcher
}

type ComponentSignalDescriptor<T = PlainComponentState> = {
  dispatcher: ComponentSignalDispatcher<T>
  target?: string
}

type SignalDefinition = {
  signal: string
  [key: string]: Definition
  [COMPONENT_CONTEXT]?: ContextOptions
  [SIGNAL_CONDITIONS]?: DisplayCondition[]
  stepId?: string
  onerror?: {
    continue?: boolean
    notify?: boolean
    signals: SignalDefinition[]
  }
}

export type { SignalDefinition, SignalDescriptor, ComponentSignalDescriptor }
