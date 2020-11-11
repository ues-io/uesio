import { wire } from "@uesio/constants"
import { WireConditionState } from "../wire/wirecondition"

type LoadRequest = {
	wire: string
	type: wire.WireType
	collection: string
	fields: LoadRequestField[]
	conditions: WireConditionState[]
}

type LoadRequestField = {
	id: string
	fields?: LoadRequestField[]
}

type LoadRequestBatch = {
	wires: LoadRequest[]
}

export { LoadRequest, LoadRequestField, LoadRequestBatch }
