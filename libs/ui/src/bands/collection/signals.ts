import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import createJob from "./operations/createjob"

// The key for the entire band
const COLLECTION_BAND = "collection"

interface CreateJobSignal extends SignalDefinition {
  collection: string
}

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
  [`${COLLECTION_BAND}/CREATE_JOB`]: {
    dispatcher: (signal: CreateJobSignal, context: Context) =>
      createJob(context.mergeString(signal.collection), context),
  },
}

export default signals
