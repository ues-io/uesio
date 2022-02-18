import { WireConditionState } from "../bands/wire/conditions/conditions"

type LoadRequest = {
	wire: string
	query?: boolean
	collection: string
	fields: LoadRequestField[]
	conditions?: WireConditionState[]
	order?: OrderDescription[]
	batchsize?: number
	batchnumber?: number
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

export { LoadRequest, LoadRequestField, LoadRequestBatch, OrderDescription }
