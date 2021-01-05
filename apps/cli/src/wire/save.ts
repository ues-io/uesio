import { post } from "../request/request"
import { Metadata } from "../metadata/metadata"
import { PlainWireRecordMap, PlainWireRecord } from "./wirerecord"
import { SaveResponseBatch } from "./saveresponse"
import * as shortid from "shortid"

const save = async (
	metadata: Metadata,
	changes: PlainWireRecordMap
): Promise<SaveResponseBatch> => {
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

const createChange = (data: PlainWireRecord[]): PlainWireRecordMap =>
	Object.fromEntries(data.map((item) => [shortid.generate(), item]))

export { save, createChange }
