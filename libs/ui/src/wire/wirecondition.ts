import { Context } from "../context/context"

const PARAM = "PARAM"
const LOOKUP = "LOOKUP"
const VALUE = "VALUE"
const SEARCH = "SEARCH"

type WireConditionState =
	| ParamConditionState
	| LookupConditionState
	| ValueConditionState
	| SearchConditionState

type ConditionBase = {
	type?: typeof SEARCH
	valueSource?: typeof VALUE | typeof LOOKUP | typeof PARAM
	id?: string
}

type SearchConditionDefinition = ConditionBase & {
	type: typeof SEARCH
	value: string
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

type WireConditionDefinition =
	| ParamConditionDefinition
	| LookupConditionDefinition
	| ValueConditionDefinition
	| SearchConditionDefinition

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
		active: true,
	}),
	[VALUE]: (definition: ValueConditionDefinition) => ({
		field: definition.field,
		valueSource: VALUE,
		value: definition.value,
		id: definition.id,
		active: true,
	}),
	[LOOKUP]: (definition: LookupConditionDefinition) => ({
		field: definition.field,
		valueSource: definition.valueSource,
		lookupWire: definition.lookupWire,
		lookupField: definition.lookupField,
		id: definition.id,
		active: true,
	}),
}

const conditionHandlers: ConditionHandlers = {
	[PARAM]: (condition: ParamConditionState, context: Context) => {
		const view = context.getView()
		const value = view?.params?.[condition.param] || ""
		return {
			field: condition.field,
			valueSource: VALUE,
			value,
			active: true,
		}
	},
	[VALUE]: (condition: ValueConditionState, context: Context) => {
		const value = context.merge(condition.value)
		return {
			field: condition.field,
			valueSource: VALUE,
			value,
			active: true,
		}
	},
	[LOOKUP]: (condition: LookupConditionState) => ({
		field: condition.field,
		valueSource: LOOKUP,
		lookupField: condition.lookupField,
		lookupWire: condition.lookupWire,
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

const getInitializedConditions = (definitions: WireConditionDefinition[]) =>
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
