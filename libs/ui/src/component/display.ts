import { Context } from "../context/context"
import { DefinitionMap } from "../definition/definition"

type DisplayConditionBase = {
	type: "collectionContext" | "paramIsSet" | undefined
}

type FieldEqualsValueCondition = {
	type: "fieldEquals" | undefined
	field: string
	value: string
} & DisplayConditionBase

type ParamIsSetCondition = {
	type: "paramIsSet"
	param: string
} & DisplayConditionBase

type ParamIsValueCondition = {
	type: "paramIsValue"
	param: string
	value: string
}

type CollectionContextCondition = {
	type: "collectionContext"
	collection: string
} & DisplayConditionBase

type DisplayCondition =
	| FieldEqualsValueCondition
	| ParamIsSetCondition
	| ParamIsValueCondition
	| CollectionContextCondition

function should(condition: DisplayCondition, context: Context) {
	if (condition.type === "collectionContext") {
		const wire = context.getWire()
		const collection = wire?.getCollection()
		return collection?.getFullName() === condition.collection
	}
	if (condition.type === "paramIsSet") {
		return !!context.getView()?.params?.[condition.param]
	}
	if (condition.type === "paramIsValue") {
		return context.getView()?.params?.[condition.param] === condition.value
	}
	const record = context.getRecord()
	const value = record?.getFieldValue(condition.field)
	return value === condition.value
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
