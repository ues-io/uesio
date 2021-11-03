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

type CollectionContextCondition = {
	type: "collectionContext"
	collection: string
}

type FeatureFlagCondition = {
	type: "featureFlag"
	name: string
}

type DisplayCondition =
	| FieldEqualsValueCondition
	| FieldNotEqualsValueCondition
	| ParamIsSetCondition
	| ParamIsValueCondition
	| CollectionContextCondition
	| FeatureFlagCondition

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
	if (condition.type === "featureFlag") {
		const featureflags = context.getViewDef()?.dependencies?.featureflags
		const featureFlag = featureflags && featureflags[condition.name]
		console.log("featureFlag -->", featureFlag)

		//a FeatureFlag that don't exists old or new one without assigment
		if (!featureFlag) {
			return true
		}

		console.log(
			"Condition:",
			condition.name,
			"Display:",
			!featureFlag?.value
		)
		//return featureFlag ? featureFlag?.value : true
		return featureFlag && !featureFlag?.value
	}
	const record = context.getRecord()
	const value = record?.getFieldValue(condition.field)

	if (condition.type === "fieldNotEquals") {
		return value !== condition.value
	}
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
