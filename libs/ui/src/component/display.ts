import { Context } from "../context/context"
import { BaseDefinition } from "../definition/definition"
import { wire as wireApi } from "../api/api"
import { WireRecord } from "../wireexports"
import { DISPLAY_CONDITIONS } from "../componentexports"

type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
	T,
	Exclude<keyof T, Keys>
> &
	{
		[K in Keys]-?: Required<Pick<T, K>> &
			Partial<Record<Exclude<Keys, K>, undefined>>
	}[Keys]

type DisplayOperator = "EQUALS" | "NOT_EQUALS" | "IN" | "NOT_IN" | undefined

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

type FieldValueCondition = RequireOnlyOne<
	FieldValueConditionBase,
	"value" | "values"
>

type ParamIsSetCondition = {
	type: "paramIsSet"
	param: string
}

type MergeCondition = {
	type: "mergeCondition"
	operator: DisplayOperator
	source: string
	value: string
}

type ParamIsNotSetCondition = {
	type: "paramIsNotSet"
	param: string
}

type ParamValueConditionBase = {
	type: "paramValue"
	param: string
	operator: DisplayOperator
	value?: string
	values?: string[]
}

type ParamValueCondition = RequireOnlyOne<
	ParamValueConditionBase,
	"value" | "values"
>

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
type Conjunction = "AND" | "OR"

type GroupCondition = {
	type: "group"
	conjunction: Conjunction
	conditions: DisplayCondition[]
}

type DisplayCondition =
	| GroupCondition
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
	| MergeCondition

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
		case "NOT_IN":
			if (Array.isArray(a)) {
				return a.includes(b) === (op === "IN")
			}
			return false
		default:
			return a === b
	}
}

function should(condition: DisplayCondition, context: Context): boolean {
	if (!condition) return true

	if (condition.type === "collectionContext") {
		const wire = context.getWire()
		const collection = wire?.getCollection()
		return collection?.getFullName() === condition.collection
	}

	if (condition.type === "group") {
		const { conjunction = "AND", conditions = [] } = condition
		return conditions[
			conjunction === "OR" && conditions?.length ? "some" : "every"
		]((c) => should(c, context))
	}

	if (condition.type === "paramIsSet")
		return !!context.getParam(condition.param)

	if (condition.type === "paramIsNotSet")
		return !context.getParam(condition.param)

	if (condition.type === "fieldMode")
		return condition.mode === context.getFieldMode()

	if (condition.type === "featureFlag")
		return !!context.getFeatureFlag(condition.name)?.value

	if (condition.type === "recordIsNew") return !!context.getRecord()?.isNew()

	if (condition.type === "recordIsNotNew")
		return !context.getRecord()?.isNew()

	if (condition.type === "hasProfile")
		return context.getUser()?.profile === condition.profile

	if (condition.type === "wireHasChanges") {
		const wire = context.getWire(condition.wire)
		return !!wire?.getChanges().length || !!wire?.getDeletes().length
	}
	if (condition.type === "wireHasNoChanges") {
		const wire = context.getWire(condition.wire)
		return !wire?.getChanges().length && !wire?.getDeletes().length
	}

	if (
		condition.type === "wireIsLoading" ||
		condition.type === "wireIsNotLoading"
	) {
		const wire = context.getWire(condition.wire)
		const isLoading = !!wire?.isLoading()
		return condition.type === "wireIsNotLoading" ? !isLoading : isLoading
	}

	if (
		condition.type === "wireHasRecords" ||
		condition.type === "wireHasNoRecords"
	) {
		const wire = context.getWire(condition.wire)
		const hasRecords = !!wire?.getData().length
		return condition.type === "wireHasNoRecords" ? !hasRecords : hasRecords
	}

	if (
		condition.type === "wireHasLoadedAllRecords" ||
		condition.type === "wireHasMoreRecordsToLoad"
	) {
		const hasAllRecords = !!context.getWire(condition.wire)?.hasAllRecords()
		return condition.type === "wireHasMoreRecordsToLoad"
			? !hasAllRecords
			: hasAllRecords
	}

	const canHaveMultipleValues =
		condition.type === "fieldValue" || condition.type === "paramValue"

	const compareToValue =
		typeof condition.value === "string"
			? context.mergeString(condition.value as string)
			: condition.value ?? (canHaveMultipleValues ? condition.values : "")

	if (condition.type === "hasNoValue") return !compareToValue
	if (condition.type === "hasValue") return !!compareToValue
	if (condition.type === "paramValue")
		return compare(
			compareToValue,
			context.getParam(condition.param),
			condition.operator
		)
	if (condition.type === "mergeCondition")
		return compare(
			compareToValue,
			context.mergeString(condition.source),
			condition.operator
		)

	if (!condition.type || condition.type === "fieldValue") {
		const record = context.getRecord(condition.wire)
		const comparator = (r: WireRecord) =>
			compare(
				compareToValue,
				condition.field ? r.getFieldValue(condition.field) ?? "" : "",
				condition.operator
			)
		if (record) return comparator(record)

		// If we have no record in context, test against all records in the wire.
		const wire = context.getWire(condition.wire)
		if (!wire) return condition.operator === "NOT_EQUALS"
		const records = wire.getData()

		// If there are no records, not_equal applies
		if (!records.length && condition.operator)
			return condition.operator.includes("NOT")

		// When we check for false condition, we want to check every record.
		const arrayMethod = condition.operator?.includes("NOT")
			? "every"
			: "some"

		return records[arrayMethod](comparator)
	}

	console.warn(`Unknown display condition type: ${condition.type}`)
	return true
}

const shouldAll = (
	conditions: DisplayCondition[] | undefined,
	context: Context
) => {
	if (!conditions?.length) return true
	return conditions.every((condition) => should(condition, context))
}

const extractWireIdsFromConditions = (
	conditions: DisplayCondition[],
	uniqueWires: Set<string>
) => {
	conditions.forEach((condition) => {
		if ("wire" in condition && condition.wire) {
			uniqueWires.add(condition.wire)
		} else if (
			condition.type === "group" &&
			condition.conditions instanceof Array
		) {
			extractWireIdsFromConditions(condition.conditions, uniqueWires)
		}
	})
}

// Create a list of all of the wires that we're going to care about
export const getWiresForConditions = (
	conditions: DisplayCondition[] | undefined,
	context: Context | undefined,
	uniqueWires = new Set<string>()
) => {
	if (!conditions) return []
	const contextWire = context?.getWireId()
	if (contextWire) uniqueWires.add(contextWire)
	extractWireIdsFromConditions(conditions, uniqueWires)
	return Array.from(uniqueWires.values())
}

const useShouldFilter = <T extends BaseDefinition>(
	items: T[] | undefined = [],
	context: Context
) => {
	const conditionsList = items.flatMap((item) => {
		const conditions = item[DISPLAY_CONDITIONS]
		return conditions ? [conditions] : []
	})

	wireApi.useWires(
		getWiresForConditions(
			conditionsList?.flatMap((c) => c),
			context
		),
		context
	)

	return items?.filter((item) => shouldAll(item[DISPLAY_CONDITIONS], context))
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
	should,
	shouldAll,
	useShouldFilter,
	useContextFilter,
	shouldHaveClass,
}

export type { DisplayCondition, DisplayOperator, ItemContext }
