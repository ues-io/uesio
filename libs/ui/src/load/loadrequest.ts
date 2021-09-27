import { WireConditionState } from "../bands/wire/conditions/conditions"
import { WireType } from "../definition/wire"

type LoadRequest = {
	wire: string
	type?: WireType
	collection: string
	fields: LoadRequestField[]
	conditions?: WireConditionState[]
	order?: OrderDescription[]
	limit?: number
	offset?: number
}

type OrderDescription = {
	field: string
	desc: boolean
}

type LoadRequestField = {
	id: string
	fields?: LoadRequestField[]
}

type LoadRequestBatch = {
	wires: LoadRequest[]
}

export { LoadRequest, LoadRequestField, LoadRequestBatch }
