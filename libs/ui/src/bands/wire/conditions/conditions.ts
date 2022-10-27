const PARAM = "PARAM"
const LOOKUP = "LOOKUP"
const VALUE = "VALUE"
const SEARCH = "SEARCH"
const GROUP = "GROUP"

type Conjunction = "AND" | "OR"

type ConditionOperators =
	| "EQ"
	| "NOT_EQ"
	| "GT"
	| "LT"
	| "GTE"
	| "LTE"
	| "IN"
	| "IS_BLANK"
	| "IS_NOT_BLANK"

type WireConditionState =
	| ParamConditionState
	| LookupConditionState
	| ValueConditionState
	| SearchConditionState
	| GroupConditionState

type ConditionBase = {
	type?: typeof SEARCH | typeof GROUP
	valueSource?: typeof VALUE | typeof LOOKUP | typeof PARAM
	id?: string
	operator?: ConditionOperators
	active?: boolean
}

type GroupConditionState = ConditionBase & {
	type: typeof GROUP
	conjunction: Conjunction
	conditions: ConditionBase[]
	valueSource: undefined
}

type SearchConditionState = ConditionBase & {
	type: typeof SEARCH
	value: string
	fields?: string[]
}

type ParamConditionState = ConditionBase & {
	field: string
	valueSource: typeof PARAM
	param: string
}

type LookupConditionState = ConditionBase & {
	field: string
	valueSource: typeof LOOKUP
	lookupWire: string
	lookupField: string
}

type ValueConditionState = ConditionBase & {
	field: string
	valueSource: typeof VALUE
	value: string
}

export {
	WireConditionState,
	LookupConditionState,
	ParamConditionState,
	ValueConditionState,
	SearchConditionState,
}
