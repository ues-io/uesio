import { WireType } from "../definition/wire"
import { WireConditionState } from "../wire/wirecondition"

type LoadRequest = {
	wire: string
	type: WireType
	collection: string
	fields: LoadRequestField[]
	conditions: WireConditionState[]
}

type LoadRequestField = {
	id: string
}

type LoadRequestBatch = {
	wires: LoadRequest[]
}

export { LoadRequest, LoadRequestField, LoadRequestBatch }
