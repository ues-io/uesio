import { Context } from "../context/context"
import { DefinitionMap } from "../definition/definition"
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
	return op === "NOT_EQUALS" ? a !== b : a === b
}

function should(condition: DisplayCondition, context: Context) {
	if (condition.type === "collectionContext") {
		const wire = context.getWire()
		const collection = wire?.getCollection()
		return collection?.getFullName() === condition.collection
	}

	if (condition.type === "paramIsSet") {
		return !!context.getView()?.params?.[condition.param]
	}

	if (condition.type === "fieldMode") {
		return condition.mode === context.getFieldMode()
	}

	if (condition.type === "featureFlag") {
		const featureflags = context.getViewDef()?.dependencies?.featureflags
		const featureFlag = featureflags && featureflags[condition.name]
		return featureFlag && featureFlag?.value
	}

	const compareToValue =
		typeof condition.value === "string"
			? context.merge(condition.value as string)
			: condition.value || ""

	if (condition.type === "hasNoValue") return !compareToValue
	if (condition.type === "hasValue") return !!compareToValue
	if (condition.type === "paramValue")
		return compare(
			context.getView()?.params?.[condition.param],
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
		if (ctxWire)
			return ctxWire
				.getData()
				.some((r) =>
					compare(
						compareToValue,
						r.getFieldValue(condition.field) || "",
						condition.operator
					)
				)
		return false
	}

	console.warn(`Unknown display condition type: ${condition.type}`)
	return true
}

function shouldDisplay(context: Context, definition?: DefinitionMap) {
	const displayLogic = definition?.["uesio.display"] as
		| DisplayCondition[]
		| undefined

	const uesio = useUesio({ context })
	if (displayLogic?.length) {
		for (const condition of displayLogic) {
			// Weird hack for now
			if (!condition.type && condition.wire) {
				uesio.wire.useWire(condition.wire)
			}
			if (!should(condition, context)) {
				return false
			}
		}
	}
	return true
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

	for (const condition of classLogic) {
		if (!should(condition, context)) {
			return false
		}
	}

	return true
}

export { shouldDisplay, shouldHaveClass }
