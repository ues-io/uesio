import { Context } from "../../context/context"
import { SignalDefinition, SignalDescriptor } from "../../definition/signal"
import { MetadataKey } from "../../metadataexports"
import { platform } from "../../platform/platform"
import { getErrorString } from "../utils"

// The key for the entire band
const BAND = "auth"

interface DeleteCredentialsSignal extends SignalDefinition {
  integration: MetadataKey
}

const signals: Record<string, SignalDescriptor> = {
  [`${BAND}/DELETE_CREDENTIALS`]: {
    dispatcher: async (
      signalInvocation: DeleteCredentialsSignal,
      context: Context,
    ) => {
      const { integration } = signalInvocation
      try {
        await platform.deleteAuthCredentials(
          context,
          context.mergeString(integration),
        )
      } catch (e) {
        // TODO error handling - maybe add a notification?
        return context.addErrorFrame([getErrorString(e)])
      }
      return context
    },
  },
}
export default signals
