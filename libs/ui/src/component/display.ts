import { Context } from "../context/context"
import { BaseDefinition } from "../definition/definition"
import { wire as wireApi } from "../api/api"
import { WireRecord, Wire } from "../wireexports"
import { Collection } from "../collectionexports"

type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
	T,
	Exclude<keyof T, Keys>
> &
	{
		[K in Keys]-?: Required<Pick<T, K>> &
			Partial<Record<Exclude<Keys, K>, undefined>>
	}[Keys]

type DisplayOperator = "EQUALS" | "NOT_EQUALS" | "IN" | "NOT IN" | undefined

// If there is a record in context, only test against that record
// If there is no record in context, test against all records in the wire.

interface FieldValueConditionBase {
	type: "fieldValue" | undefined
	wire?: string
	field: string
	operator: DisplayOperator
	value?: string
	values?: string[]
}

type Comparator = (r: WireRecord) => boolean

type FieldValueCondition = RequireOnlyOne<
	FieldValueConditionBase,
	"value" | "values"
>

type ParamIsSetCondition = {
	type: "paramIsSet"
	param: string
}

type ParamIsNotSetCondition = {
	type: "paramIsNotSet"
	param: string
}

type ParamValueCondition = {
	type: "paramValue"
	param: string
	operator: DisplayOperator
	value: string
}

type HasNoValueCondition = {
	type: "hasNoValue"
	value: unknown
	wire?: string
}

type RecordIsNewCondition = {
	type: "recordIsNew"
}

type RecordIsNotNewCondition = {
	type: "recordIsNotNew"
}

type HasValueCondition = {
	type: "hasValue"
	value: unknown
	wire?: string
}

type CollectionContextCondition = {
	type: "collectionContext"
	collection: string
}

type FeatureFlagCondition = {
	type: "featureFlag"
	name: string
}

type FieldModeCondition = {
	type: "fieldMode"
	mode: "READ" | "EDIT"
}

type WireHasNoChanges = {
	type: "wireHasNoChanges"
	wire: string
}
type WireHasChanges = {
	type: "wireHasChanges"
	wire: string
}
type WireIsLoading = {
	type: "wireIsLoading"
	wire: string
}
type WireIsNotLoading = {
	type: "wireIsNotLoading"
	wire: string
}
type WireHasLoadedAllRecords = {
	type: "wireHasLoadedAllRecords"
	wire: string
}
type WireHasMoreRecordsToLoad = {
	type: "wireHasMoreRecordsToLoad"
	wire: string
}
type WireHasNoRecords = {
	type: "wireHasNoRecords"
	wire: string
}
type WireHasRecords = {
	type: "wireHasRecords"
	wire: string
}

type HasProfile = {
	type: "hasProfile"
	profile: string
}

type DisplayConditionWithWire =
	| FieldValueCondition
	| WireHasChanges
	| WireHasNoChanges
	| WireIsLoading
	| WireIsNotLoading
	| WireHasNoRecords
	| WireHasRecords
	| WireHasLoadedAllRecords
	| WireHasMoreRecordsToLoad

type DisplayCondition =
	| HasProfile
	| WireHasChanges
	| WireHasNoChanges
	| HasNoValueCondition
	| HasValueCondition
	| FieldValueCondition
	| ParamIsSetCondition
	| ParamIsNotSetCondition
	| ParamValueCondition
	| CollectionContextCondition
	| FeatureFlagCondition
	| FieldModeCondition
	| RecordIsNewCondition
	| RecordIsNotNewCondition
	| WireIsLoading
	| WireIsNotLoading
	| WireHasNoRecords
	| WireHasRecords
	| WireHasLoadedAllRecords
	| WireHasMoreRecordsToLoad

type ItemContext<T> = {
	item: T
	context: Context
}

function compare(a: unknown, b: unknown, op: DisplayOperator) {
	if (
		op &&
		op.includes("EQUALS") &&
		a &&
		b &&
		Object.prototype.toString.call(a) +
			Object.prototype.toString.call(b) !==
			"[object String][object String]"
	)
		console.warn(
			"You're comparing objects in a display condition, this is probably an error"
		)

	switch (op) {
		case "NOT_EQUALS":
			return a !== b
		case "IN":
		case "NOT IN":
			if (Array.isArray(a)) {
				return a.includes(b) === (op === "IN")
			}
			return false
		default:
			return a === b
	}
}

const paramTypesWithValues = [
	"paramValue",
	"hasNoValue",
	"hasValue",
	"fieldValue",
]

function getCompareToValue(condition: DisplayCondition, context: Context) {
	if (condition.type && paramTypesWithValues.includes(condition.type)) {
		const c = condition as
			| ParamValueCondition
			| HasValueCondition
			| HasNoValueCondition
			| FieldValueCondition
		return typeof c.value === "string"
			? context.mergeString(c.value as string)
			: c.value || (c.type === "fieldValue" ? c.values : "")
	}
}

function should(condition: DisplayCondition, context: Context) {
	if (!condition.type) {
		condition.type = "fieldValue"
	}
	let wire: Wire | undefined =
		condition.type.startsWith("wire") || condition.type === "fieldValue"
			? context.getWire((condition as DisplayConditionWithWire)?.wire)
			: undefined
	let collection: Collection | undefined = undefined
	let record: WireRecord | undefined = undefined
	let records: WireRecord[] | undefined = undefined
	let arrayMethod: "every" | "some" | undefined = undefined
	let comparator: Comparator | undefined = undefined
	const compareToValue = getCompareToValue(condition, context)
	switch (condition.type) {
		case "collectionContext":
			wire = context.getWire()
			if (!wire) return false
			collection = wire.getCollection()
			return collection?.getFullName() === condition.collection
		case "paramIsSet":
			return !!context.getParam(condition.param)
		case "paramIsNotSet":
			return !context.getParam(condition.param)
		case "fieldMode":
			return condition.mode === context.getFieldMode()
		case "featureFlag":
			return !!context.getFeatureFlag(condition.name)?.value
		case "recordIsNew":
			return !!context.getRecord()?.isNew()
		case "recordIsNotNew":
			return !context.getRecord()?.isNew()
		case "hasProfile":
			return context.getUser()?.profile === condition.profile
		case "wireHasChanges":
		case "wireHasNoChanges":
			if (!wire) return false
			return wire.hasChanged() === (condition.type === "wireHasChanges")
		case "wireIsLoading":
		case "wireIsNotLoading":
			if (!wire) return false
			return (condition.type === "wireIsLoading") === wire.isLoading()
		case "wireHasRecords":
		case "wireHasNoRecords":
			if (!wire) return false
			return (
				(condition.type === "wireHasRecords") ===
				wire.getData().length > 0
			)
		case "wireHasLoadedAllRecords":
		case "wireHasMoreRecordsToLoad":
			if (!wire) return false
			return (
				(condition.type === "wireHasLoadedAllRecords") ===
				wire.hasAllRecords()
			)
		case "hasNoValue":
			return !compareToValue
		case "hasValue":
			return !!compareToValue
		case "paramValue":
			return compare(
				context.getParam(condition.param),
				compareToValue,
				condition.operator
			)
		case "fieldValue":
			record = context.getRecord(condition.wire)
			comparator = (r: WireRecord) =>
				compare(
					compareToValue,
					condition.field
						? r.getFieldValue(condition.field) || ""
						: "",
					condition.operator
				)
			if (record) return comparator(record)

			// If we have no record in context, test against all records in the wire.
			if (!wire) return condition.operator === "NOT_EQUALS"
			records = wire.getData()

			// If there are no records, not_equal applies
			if (!records.length) return condition.operator?.includes("NOT")

			// When we check for false condition, we want to check every record.
			arrayMethod = condition.operator?.includes("NOT") ? "every" : "some"

			return records[arrayMethod](comparator)
		default:
			console.warn(`Unknown display condition type: ${condition.type}`)
			return true
	}
}

const shouldAll = (
	conditions: DisplayCondition[] | undefined,
	context: Context
) => {
	if (!conditions || !conditions.length) return true
	return conditions.every((condition) => should(condition, context))
}

// Create a list of all of the wires that we're going to care about
const getWiresForConditions = (
	conditions: DisplayCondition[] | undefined,
	context: Context
) => {
	if (!conditions) return []
	const contextWire = context.getWireId()
	return [
		...(contextWire ? [contextWire] : []),
		...conditions.flatMap((condition) =>
			"wire" in condition && condition.wire ? [condition.wire] : []
		),
	]
}

const useShouldFilter = <T extends BaseDefinition>(
	items: T[] | undefined = [],
	context: Context
) => {
	const conditionsList = items.flatMap((item) => {
		const conditions = item["uesio.display"]
		return conditions ? [conditions] : []
	})

	wireApi.useWires(
		getWiresForConditions(
			conditionsList?.flatMap((c) => c),
			context
		),
		context
	)

	return items?.filter((item, index) =>
		shouldAll(conditionsList[index], context)
	)
}

const useContextFilter = <T>(
	items: T[],
	conditions: DisplayCondition[] | undefined,
	contextFunc: (item: T, context: Context) => Context,
	context: Context
): ItemContext<T>[] => {
	wireApi.useWires(getWiresForConditions(conditions, context), context)
	return items.flatMap((item) => {
		const newContext = contextFunc(item, context)
		return shouldAll(conditions, newContext)
			? [
					{
						item,
						context: newContext,
					},
			  ]
			: []
	})
}

const useShould = (
	conditions: DisplayCondition[] | undefined,
	context: Context
) => {
	wireApi.useWires(getWiresForConditions(conditions, context), context)
	return shouldAll(conditions, context)
}

function shouldHaveClass(
	context: Context,
	className: string,
	definition?: BaseDefinition
) {
	const classesLogic = definition?.["uesio.classes"] as
		| Record<string, DisplayCondition[]>
		| undefined
	const classLogic = classesLogic?.[className]
	if (!classLogic?.length) return false

	return shouldAll(classLogic, context)
}

export {
	useShould,
	shouldAll,
	useShouldFilter,
	useContextFilter,
	shouldHaveClass,
	DisplayCondition,
	DisplayOperator,
	ItemContext,
}
