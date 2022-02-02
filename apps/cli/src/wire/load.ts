import { post } from "../request/request"
import { Metadata } from "../metadata/metadata"
import type { wire } from "@uesio/ui"
import { User } from "../auth/login"

const load = async (
	metadata: Metadata,
	user: User,
	conditions?: wire.WireConditionState[]
): Promise<wire.LoadResponseBatch> => {
	const request = {
		wires: [
			{
				wire: "CLI_LOAD",
				query: true,
				collection: metadata.getCollectionName(),
				fields: metadata.getFields(),
				conditions: conditions || [],
			},
		],
	}

	const response = await post(
		"site/wires/load",
		JSON.stringify(request),
		user.cookie
	)

	return response.json() as Promise<wire.LoadResponseBatch>
}

export { load }
