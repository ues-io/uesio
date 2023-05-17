import { PlainFieldValue } from "../../wirerecord/types"

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
	valueSource?: undefined
	fields?: string[]
}

type ParamConditionState = ConditionBase & {
	type?: undefined
	field: string
	valueSource: typeof PARAM
	params?: string[]
	param: string
}

type LookupConditionState = ConditionBase & {
	type?: undefined
	field: string
	valueSource: typeof LOOKUP
	lookupWire: string
	lookupField: string
}

type ValueConditionState = ConditionBase & {
	type?: undefined
	field: string
	valueSource: typeof VALUE | undefined
	value: PlainFieldValue
	values?: PlainFieldValue[]
	start?: PlainFieldValue
	end?: PlainFieldValue
	inclusiveStart?: boolean
	inclusiveEnd?: boolean
}

const isValueCondition = (
	condition: WireConditionState | undefined
): condition is ValueConditionState =>
	!!condition &&
	!condition.type &&
	(condition.valueSource === "VALUE" || !condition.valueSource)

const isGroupCondition = (
	condition: WireConditionState | undefined
): condition is ValueConditionState => condition?.type === "GROUP"

export { isValueCondition, isGroupCondition }

export type {
	WireConditionState,
	LookupConditionState,
	ParamConditionState,
	ValueConditionState,
	SearchConditionState,
}
