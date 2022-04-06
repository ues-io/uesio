// import { useWire } from "../bands/wire/selectors"
import { get } from "lodash"
import { Context } from "../context/context"
import { DefinitionMap } from "../definition/definition"

type FieldEqualsValueCondition = {
	type: "fieldEquals" | undefined
	field: string
	value: string
}

type FieldNotEqualsValueCondition = {
	type: "fieldNotEquals"
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

type FindInWireCondition = {
	type: "findInWire"
	wire: string
	field: string
	value: string
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
	| FindInWireCondition

function should(condition: DisplayCondition, context: Context) {
	if (condition.type === "collectionContext") {
		const wire = context.getWire()
		const collection = wire?.getCollection()
		return collection?.getFullName() === condition.collection
	}

	if (condition.type === "paramIsSet") {
		return !!context.getView()?.params?.[condition.param]
	}

	if (condition.type === "findInWire") {
		const wire = context.getWireById(condition.wire)
		if (!wire) return false
		const data = wire.data
		const path = condition.field.split("->")
		// loop over the data to check if we find the value at path
		return Object.keys(data).find(
			(k) => get(data[k], path) === context.merge(condition.value)
		)
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

	const value = context.getRecord()?.getFieldValue(condition.field)

	if (condition.type === "fieldNotEquals") return value !== compareToValue
	return value === compareToValue
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
