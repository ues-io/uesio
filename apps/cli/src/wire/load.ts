import { post } from "../request/request"
import { Metadata } from "../metadata/metadata"
import { wire } from "@uesio/ui"

const load = async (
	metadata: Metadata,
	conditions?: wire.WireConditionState[]
): Promise<wire.LoadResponseBatch> => {
	const request = {
		wires: [
			{
				wire: "CLI_LOAD",
				type: "QUERY",
				collection: metadata.getCollectionName(),
				fields: metadata.getFields(),
				conditions: conditions || [],
			},
		],
	}

	const response = await post("site/wires/load", JSON.stringify(request))

	return response.json()
}

export { load }
