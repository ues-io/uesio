import { Context } from "../context/context"
import { BaseDefinition, DefinitionMap } from "../definition/definition"
import { useUesio } from "../hooks/hooks"

type DisplayOperator = "EQUALS" | "NOT_EQUALS" | undefined

// If there is a record in context, only test against that record
// If there is no record in context, test against all records in the wire.
type FieldValueCondition = {
	type: "fieldValue" | undefined
	wire?: string
	field: string
	operator: DisplayOperator
	value: string
}

type ParamIsSetCondition = {
	type: "paramIsSet"
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
}
type HasValueCondition = {
	type: "hasValue"
	value: unknown
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

type DisplayCondition =
	| HasNoValueCondition
	| HasValueCondition
	| FieldValueCondition
	| ParamIsSetCondition
	| ParamValueCondition
	| CollectionContextCondition
	| FeatureFlagCondition
	| FieldModeCondition

function compare(a: unknown, b: unknown, op: DisplayOperator) {
	if (
		a &&
		b &&
		Object.prototype.toString.call(a) +
			Object.prototype.toString.call(b) !==
			"[object String][object String]"
	)
		console.warn(
			"You're comparing objects in a display condition, this is probably an error"
		)

	return op === "NOT_EQUALS" ? a !== b : a === b
}

function should(condition: DisplayCondition, context: Context) {
	if (condition.type === "collectionContext") {
		const wire = context.getWire()
		const collection = wire?.getCollection()
		return collection?.getFullName() === condition.collection
	}

	if (condition.type === "paramIsSet") {
		return !!context.getParam(condition.param)
	}

	if (condition.type === "fieldMode") {
		return condition.mode === context.getFieldMode()
	}

	if (condition.type === "featureFlag") {
		return !!context.getFeatureFlag(condition.name)?.value
	}

	const compareToValue =
		typeof condition.value === "string"
			? context.merge(condition.value as string)
			: condition.value || ""

	if (condition.type === "hasNoValue") return !compareToValue
	if (condition.type === "hasValue") return !!compareToValue
	if (condition.type === "paramValue")
		return compare(
			context.getParam(condition.param),
			compareToValue,
			condition.operator
		)

	if (!condition.type || condition.type === "fieldValue") {
		const ctx = condition.wire
			? context.addFrame({ wire: condition.wire })
			: context

		const ctxRecord = ctx.getRecord()
		// If we have a record in context, use it.
		if (ctxRecord)
			return compare(
				compareToValue,
				ctxRecord.getFieldValue(condition.field) || "",
				condition.operator
			)

		// If we have no record in context, test against all records in the wire.
		const ctxWire = ctx.getWire()
		if (ctxWire) {
			const records = ctxWire.getData()

			// When we check for false condition, we want to check every record.
			const arrayMethod =
				condition.operator === "NOT_EQUALS" ? "every" : "some"

			// If there are no records, not_equal applies
			if (condition.operator === "NOT_EQUALS" && !records.length)
				return true

			return records[arrayMethod]((r) =>
				compare(
					compareToValue,
					r.getFieldValue(condition.field) || "",
					condition.operator
				)
			)
		}
		return false
	}

	console.warn(`Unknown display condition type: ${condition.type}`)
	return true
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
			!condition.type && condition.wire ? [condition.wire] : []
		),
	]
}

const useShouldFilter = <T extends BaseDefinition>(
	items: T[] | undefined,
	context: Context
) => {
	if (!items) return []
	const conditionsList = items.flatMap((item) => {
		const conditions = item["uesio.display"]
		return conditions ? [conditions] : []
	})

	const uesio = useUesio({ context })
	uesio.wire.useWires(
		getWiresForConditions(
			conditionsList?.flatMap((c) => c),
			context
		)
	)

	return items?.filter((item, index) =>
		shouldAll(conditionsList[index], context)
	)
}

const useShould = (
	conditions: DisplayCondition[] | undefined,
	context: Context
) => {
	const uesio = useUesio({ context })
	uesio.wire.useWires(getWiresForConditions(conditions, context))
	return shouldAll(conditions, context)
}

function shouldHaveClass(
	context: Context,
	className: string,
	definition?: DefinitionMap
) {
	const classesLogic = definition?.["uesio.classes"] as
		| Record<string, DisplayCondition[]>
		| undefined
	const classLogic = classesLogic?.[className]
	if (!classLogic?.length) return false

	return shouldAll(classLogic, context)
}

export { useShould, useShouldFilter, shouldHaveClass, DisplayCondition }
