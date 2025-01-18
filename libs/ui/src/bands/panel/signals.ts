import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { runMany } from "../../hooks/signalapi"
import { open, close, closeAll } from "./operations"
import { getCurrentState } from "../../store/store"
import { selectors } from "./adapter"
import { DefinitionMap } from "../../definition/definition"
import { PanelState } from "./types"

// The key for the entire band
const PANEL_BAND = "panel"

interface ToggleSignal extends SignalDefinition {
  panel: string
  definition?: DefinitionMap
}

const runPanelAfterCloseSignals = (panelId: string, context: Context) => {
  const afterCloseSignals = context.getViewDef()?.panels?.[panelId]?.afterClose
  // Don't run after-close signals in the builder (signified by presence of a custom slot)
  if (afterCloseSignals?.length && !context.getCustomSlotLoader()) {
    return runMany(afterCloseSignals, context)
  }
  return context
}

const closeDispatcher = (
  signal: ToggleSignal,
  panelState: PanelState | undefined,
  context: Context,
) => {
  close(context, signal.panel, panelState)
  return runPanelAfterCloseSignals(signal.panel, context)
}

const openDispatcher = (
  signal: ToggleSignal,
  panelState: PanelState | undefined,
  context: Context,
) => open(context, signal.panel, panelState, signal.definition)

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
  [`${PANEL_BAND}/TOGGLE`]: {
    dispatcher: (signal: ToggleSignal, context: Context) => {
      const { panel } = signal
      const panelState = selectors.selectById(getCurrentState(), panel)
      return (panelState ? closeDispatcher : openDispatcher)(
        signal,
        panelState,
        context,
      )
    },
  },
  [`${PANEL_BAND}/OPEN`]: {
    dispatcher: (signal: ToggleSignal, context: Context) => {
      const { panel } = signal
      const panelState = selectors.selectById(getCurrentState(), panel)
      return openDispatcher(signal, panelState, context)
    },
  },
  [`${PANEL_BAND}/CLOSE`]: {
    dispatcher: (signal: ToggleSignal, context: Context) => {
      const { panel } = signal
      const panelState = selectors.selectById(getCurrentState(), panel)
      return closeDispatcher(signal, panelState, context)
    },
  },
  [`${PANEL_BAND}/CLOSE_ALL`]: {
    dispatcher: (signal: ToggleSignal, context: Context) => {
      const openPanels = selectors.selectAll(getCurrentState())
      // Shortcut - no open panels
      if (!openPanels?.length) return context
      // Otherwise, we need to close them all
      closeAll(context)
      // Then run all of the afterClose signals for each panel
      // Question: Should we run in the original initiation context?
      // Or in the signal-initiation context?
      return Promise.all(
        openPanels.map((panelState) => {
          const { id } = panelState
          return runPanelAfterCloseSignals(id, context)
        }),
      ).then(() => context)
    },
  },
}

export default signals
