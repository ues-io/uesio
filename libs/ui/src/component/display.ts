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

type CollectionContextCondition = {
	type: "collectionContext"
	collection: string
} & DisplayConditionBase

type DisplayCondition =
	| FieldEqualsValueCondition
	| ParamIsSetCondition
	| CollectionContextCondition

function shouldDisplayCondition(condition: DisplayCondition, context: Context) {
	if (condition.type === "collectionContext") {
		const wire = context.getWire()
		const collection = wire?.getCollection()
		return collection?.getFullName() === condition.collection
	}
	if (condition.type === "paramIsSet") {
		return !!context.getView()?.params?.[condition.param]
	}
	const record = context.getRecord()
	const value = record?.getFieldValue(condition.field)
	return value === condition.value
}

function shouldDisplay(context: Context, definition?: DefinitionMap) {
	const displayLogic = definition?.["uesio.display"] as DisplayCondition[]
	if (displayLogic && displayLogic.length) {
		for (const condition of displayLogic) {
			if (!shouldDisplayCondition(condition, context)) {
				return false
			}
		}
	}
	return true
}

export { shouldDisplay }
