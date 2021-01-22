// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { wire } from "../../../../libs/constants/src/index"

type LoadRequest = {
	wire: string
	type: wire.WireType
	collection: string
	fields: LoadRequestField[]
	conditions: LoadRequestCondition[]
	order: OrderDescription[]
	limit: number
	offset: number
}

type LoadRequestField = {
	id: string
}

type LoadRequestCondition =
	| LoadRequestLookupCondition
	| LoadRequestValueCondition

type LoadRequestLookupCondition = {
	field: string
	valuesource: "LOOKUP"
	lookupWire: string
	lookupField: string
}

type LoadRequestValueCondition = {
	field: string
	valuesource: "VALUE"
	value: string
}

type LoadRequestBatch = {
	wires: LoadRequest[]
}

type OrderDescription = {
	field: string
	desc: boolean
}

export { LoadRequest, LoadRequestField, LoadRequestBatch, LoadRequestCondition }
