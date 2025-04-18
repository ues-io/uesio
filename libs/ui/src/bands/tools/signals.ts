import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"

// The key for the entire band
const BAND = "tools"

interface PerformanceMarkSignal extends SignalDefinition {
  marker: string
  logToConsole?: boolean
  stepId?: string
}
interface PerformanceMeasureSignal extends SignalDefinition {
  measureName: string
  startMarker: string
  endMarker?: string
  logToConsole?: boolean
  stepId?: string
}
interface ConsoleLogSignal extends SignalDefinition {
  text: string
}

const signals: Record<string, SignalDescriptor> = {
  [`${BAND}/MARK`]: {
    dispatcher: (signalInvocation: PerformanceMarkSignal, context: Context) => {
      const { marker } = signalInvocation
      window.performance.mark(context.mergeString(marker))
      return context
    },
  },
  [`${BAND}/MEASURE`]: {
    dispatcher: (
      signalInvocation: PerformanceMeasureSignal,
      context: Context,
    ) => {
      const { measureName, startMarker, endMarker, logToConsole, stepId } =
        signalInvocation
      const results = window.performance.measure(
        context.mergeString(measureName),
        context.mergeString(startMarker),
        endMarker ? context.mergeString(endMarker) : undefined,
      )
      if (logToConsole) {
        console.info(results) // eslint-disable-line no-console -- The entire point of this signal is to log to the console
      }
      if (stepId) {
        return context.addSignalOutputFrame(stepId, {
          measure: measureName,
          results,
        })
      }
      return context
    },
  },
  [`${BAND}/LOG`]: {
    dispatcher: (signalInvocation: ConsoleLogSignal, context: Context) => {
      const { text } = signalInvocation
      console.info(context.mergeString(text)) // eslint-disable-line no-console -- The entire point of this signal is to log to the console
      return context
    },
  },
}
export default signals
