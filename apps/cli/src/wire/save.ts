import { post } from "../request/request"
import { Metadata } from "../metadata/metadata"
import type { wire } from "@uesio/ui"
import { nanoid } from "nanoid"
import { User } from "../auth/login"

const save = async (
	metadata: Metadata,
	user: User,
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

	const response = await post(
		"site/wires/save",
		JSON.stringify(request),
		user.cookie
	)

	return response.json() as Promise<wire.SaveResponseBatch>
}

const createChange = (
	data: wire.PlainWireRecord[]
): Record<string, wire.PlainWireRecord> =>
	Object.fromEntries(data.map((item) => [nanoid(), item]))

export { save, createChange }
