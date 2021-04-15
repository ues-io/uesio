import { post } from "../request/request"
import { Metadata } from "../metadata/metadata"
import { wire } from "@uesio/ui"
import shortid from "shortid"

const save = async (
	metadata: Metadata,
	changes: Record<string, wire.PlainWireRecord>
): Promise<wire.SaveResponseBatch> => {
	const request = {
		wires: [
			{
				wire: "CLI_SAVE",
				collection: metadata.getCollectionName(),
				changes,
				deletes: {},
			},
		],
	}

	const response = await post("site/wires/save", JSON.stringify(request))

	return response.json()
}

const createChange = (
	data: wire.PlainWireRecord[]
): Record<string, wire.PlainWireRecord> =>
	Object.fromEntries(data.map((item) => [shortid.generate(), item]))

export { save, createChange }
