import { api, context, platform } from "@uesio/ui"

const useActionParams = (
	context: context.Context,
	integration: string,
	action: string
) =>
	api.platform.usePlatformFunc(() =>
		platform.platform.describeIntegrationAction(
			context,
			integration,
			action
		)
	)

export default useActionParams
