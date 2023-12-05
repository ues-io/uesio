import { Context } from "../context/context"
import { platform } from "../platform/platform"
import usePlatformFunc from "./useplatformfunc"

const useActionParams = (
	context: Context,
	integration: string,
	action: string
) =>
	usePlatformFunc(() =>
		platform.getIntegrationActionParams(context, integration, action)
	)

export { useActionParams }
