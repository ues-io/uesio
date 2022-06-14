import { getFullWireId } from ".."
import { Context } from "../../../context/context"

const PARAM = "PARAM"
const LOOKUP = "LOOKUP"
const VALUE = "VALUE"
const SEARCH = "SEARCH"
const GROUP = "GROUP"

const EQ = "EQ"
const NOT_EQ = "NOT_EQ"
const GT = "GT"
const LT = "LT"
const GTE = "GTE"
const LTE = "LTE"
const IN = "IN"
const IS_BLANK = "IS_BLANK"
const IS_NOT_BLANK = "IS_NOT_BLANK"

type WireConditionState =
	| ParamConditionState
	| LookupConditionState
	| ValueConditionState
	| SearchConditionState
	| GroupConditionState

type ConditionBase = {
	type?: typeof SEARCH | typeof GROUP
	valueSource?: typeof VALUE | typeof LOOKUP | typeof PARAM
	conjunction?: "AND" | "OR"
	id?: string
	operator?:
		| typeof EQ
		| typeof NOT_EQ
		| typeof GT
		| typeof LT
		| typeof GTE
		| typeof LTE
		| typeof IN
		| typeof IS_BLANK
		| typeof IS_NOT_BLANK
}

type GroupConditionDefinition = ConditionBase & {
	type: typeof GROUP
	conditions: WireConditionState[]
}

type GroupConditionState = GroupConditionDefinition & {
	active: boolean
}

type SearchConditionDefinition = ConditionBase & {
	type: typeof SEARCH
	value: string
	fields?: string[]
}

type SearchConditionState = SearchConditionDefinition & {
	active: boolean
}

type ParamConditionDefinition = ConditionBase & {
	field: string
	valueSource: typeof PARAM
	param: string
}

type ParamConditionState = ParamConditionDefinition & {
	active: boolean
}

type LookupConditionDefinition = ConditionBase & {
	field: string
	valueSource: typeof LOOKUP
	lookupWire: string
	lookupField: string
}

type LookupConditionState = LookupConditionDefinition & {
	active: boolean
}

type ValueConditionDefinition = ConditionBase & {
	field: string
	valueSource: typeof VALUE
	value: string
}

type ValueConditionState = ValueConditionDefinition & {
	active: boolean
}

type BlankConditionDefinition = ConditionBase & {
	field: string
}

type BlankConditionState = BlankConditionDefinition & {
	active: boolean
}

type WireConditionDefinition =
	| ParamConditionDefinition
	| LookupConditionDefinition
	| ValueConditionDefinition
	| SearchConditionDefinition
	| BlankConditionState

type ConditionHandler = (
	condition: WireConditionState,
	context: Context
) => WireConditionState
type ConditionHandlers = {
	[key: string]: ConditionHandler
}

type ConditionInitializer = (
	definition: WireConditionDefinition
) => WireConditionState
type ConditionInitializers = {
	[key: string]: ConditionInitializer
}

const conditionInitializers: ConditionInitializers = {
	[PARAM]: (definition: ParamConditionDefinition) => ({
		field: definition.field,
		valueSource: definition.valueSource,
		param: definition.param,
		id: definition.id,
		conjunction: definition.conjunction,
		active: true,
		operator: definition.operator,
	}),
	[VALUE]: (definition: ValueConditionDefinition) => ({
		field: definition.field,
		valueSource: VALUE,
		value: definition.value,
		id: definition.id,
		conjunction: definition.conjunction,
		active: true,
		operator: definition.operator,
	}),
	[LOOKUP]: (definition: LookupConditionDefinition) => ({
		field: definition.field,
		valueSource: definition.valueSource,
		lookupWire: definition.lookupWire,
		lookupField: definition.lookupField,
		id: definition.id,
		conjunction: definition.conjunction,
		active: true,
		operator: definition.operator,
	}),
}

const conditionHandlers: ConditionHandlers = {
	[PARAM]: (condition: ParamConditionState, context) => {
		const value = context.getParam(condition.param) || ""
		return {
			...condition,
			valueSource: VALUE,
			value,
			active: true,
		}
	},
	[VALUE]: (condition: ValueConditionState, context: Context) => {
		const value = context.merge(condition.value)
		return {
			...condition,
			valueSource: VALUE,
			value,
			active: true,
		}
	},
	[LOOKUP]: (condition: LookupConditionState, context: Context) => ({
		...condition,
		valueSource: LOOKUP,
		lookupWire: getFullWireId(
			context.getViewId() || "",
			condition.lookupWire
		),
		active: true,
	}),
}

const getLoadRequestConditions = (
	conditions: WireConditionState[],
	context: Context
) =>
	conditions
		.filter((condition) => condition.active)
		.map((condition) => {
			const conditionHandler =
				conditionHandlers[condition.valueSource || VALUE]
			if (conditionHandler) {
				return conditionHandler(condition, context)
			}
			throw new Error("Invalid condition type")
		})

const getInitializedConditions = (
	definitions: WireConditionDefinition[] | undefined
) =>
	definitions
		? definitions.map((definition) => {
				const initializer =
					conditionInitializers[definition.valueSource || VALUE]
				if (initializer) {
					return initializer(definition)
				}
				throw new Error("Invalid condition type")
		  })
		: []

export {
	WireConditionState,
	WireConditionDefinition,
	LookupConditionDefinition,
	LookupConditionState,
	ParamConditionDefinition,
	ParamConditionState,
	ValueConditionDefinition,
	ValueConditionState,
	SearchConditionDefinition,
	SearchConditionState,
	getLoadRequestConditions,
	getInitializedConditions,
}
