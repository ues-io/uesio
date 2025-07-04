import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { deleteFile } from "../../hooks/fileapi"

// The key for the entire band
const BAND = "userfile"

interface DeleteUserFileSignal extends SignalDefinition {
  id: string
}

// "Signal Handlers" for all of the signals in the band
const signals: Record<string, SignalDescriptor> = {
  [`${BAND}/DELETE`]: {
    dispatcher: async (signal: DeleteUserFileSignal, context: Context) => {
      await deleteFile(context, context.mergeString(signal.id))
      return context
    },
  },
}
export default signals
