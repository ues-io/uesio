import { Context } from "../context/context"
import { DefinitionMap } from "../definition/definition"

type FieldNotEqualsValueCondition = {
	field: string
	value: string
}

type HideCondition = FieldNotEqualsValueCondition

function should(condition: HideCondition, context: Context) {
	const record = context.getRecord()
	const value = record?.getFieldValue(condition.field)
	return value !== condition.value
}

function shouldHide(context: Context, definition?: DefinitionMap) {
	const hideLogic = definition?.["uesio.hide"] as HideCondition[] | undefined
	if (hideLogic?.length) {
		for (const condition of hideLogic) {
			if (!should(condition, context)) {
				return false
			}
		}
	}
	return true
}

export { shouldHide }
