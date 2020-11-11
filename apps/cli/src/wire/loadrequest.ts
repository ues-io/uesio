type WireType = "CREATE" | "QUERY"

type LoadRequest = {
	wire: string
	type: WireType
	collection: string
	fields: LoadRequestField[]
	conditions: LoadRequestCondition[]
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

export { LoadRequest, LoadRequestField, LoadRequestBatch, LoadRequestCondition }
