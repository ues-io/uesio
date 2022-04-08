// import { useWire } from "../bands/wire/selectors"
import { get } from "lodash"
import { context } from ".."

import { Context } from "../context/context"
import { DefinitionMap } from "../definition/definition"

type FieldEqualsValueCondition = {
	type: "fieldEquals" | undefined
	field: string
	wire?: string
	value: string
}

type FieldNotEqualsValueCondition = {
	type: "fieldNotEquals"
	field: string
	wire?: string
	value: string
}

type WireHasRecordCondition = {
	type: "wireHasRecord"
	wire?: string
	field: string
	value: string
}

type WireDoesNotHaveRecordCondition = {
	type: "wireDoesNotHaveRecord"
	wire?: string
	field: string
	value: string
}

type ParamIsSetCondition = {
	type: "paramIsSet"
	param: string
}

type ParamIsValueCondition = {
	type: "paramIsValue"
	param: string
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

type WireHasDataCondition = {
	type: "wireHasData"
	wire?: string
}

type DisplayCondition =
	| HasNoValueCondition
	| HasValueCondition
	| FieldEqualsValueCondition
	| FieldNotEqualsValueCondition
	| ParamIsSetCondition
	| ParamIsValueCondition
	| CollectionContextCondition
	| FeatureFlagCondition
	| FieldModeCondition
	| WireHasRecordCondition
	| WireDoesNotHaveRecordCondition
	| WireHasDataCondition

const wireHasRecordConditionCheck = (
	context: context.Context,
	field: string,
	value: string,
	wireName?: string
) => {
	const newContext = context.addFrame({
		wire: wireName,
	})
	const wire = newContext.getWire()
	if (!wire) return false
	const data = wire.getData()
	const path = field.split("->")
	// loop over the records to check if we find the value at path
	return data.some(
		(r) => get(r, ["source", ...path]) === context.merge(value)
	)
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

	if (
		condition.type === "wireHasRecord" ||
		condition.type === "wireDoesNotHaveRecord"
	) {
		const answer = wireHasRecordConditionCheck(
			context,
			condition.field,
			condition.value,
			condition.wire
		)
		return condition.type === "wireHasRecord" ? answer : !answer
	}

	if (condition.type === "wireHasData") {
		const wire = context.getWire(condition.wire)
		if (!wire) return false
		return !!wire.getData().length
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
			: condition.value

	if (condition.type === "hasNoValue") return !compareToValue
	if (condition.type === "hasValue") return !!compareToValue
	if (condition.type === "paramIsValue")
		return context.getView()?.params?.[condition.param] === compareToValue

	const ctx = condition.wire
		? context
		: context.addFrame({
				wire: condition.wire,
		  })
	const value = ctx.getRecord()?.getFieldValue(condition.field)

	if (condition.type === "fieldNotEquals") return value !== compareToValue
	if (condition.type === "fieldEquals") return value === compareToValue

	console.warn(`Unknown display condition type: ${condition.type}`)
	return true
}

function shouldDisplay(context: Context, definition?: DefinitionMap) {
	const displayLogic = definition?.["uesio.display"] as
		| DisplayCondition[]
		| undefined

	if (displayLogic?.length) {
		for (const condition of displayLogic) {
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
