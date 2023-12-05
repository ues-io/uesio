import { RunActionSignal } from "../bands/integration/signals"
import { Context } from "../context/context"
import { platform } from "../platform/platform"
import usePlatformFunc from "./useplatformfunc"

const useActionParams = (context: Context, signal: RunActionSignal) =>
	usePlatformFunc(
		() =>
			platform.getIntegrationActionParams(
				context,
				signal.integrationType,
				signal.action
			),
		[signal.integrationType, signal.action]
	)

export { useActionParams }
