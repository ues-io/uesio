import { Context } from "../context/context"
import { DefinitionMap } from "../definition/definition"
import { useUesio } from "../hooks/hooks"
import { should, DisplayCondition } from "./display"

function shouldEnable(context: Context, definition?: DefinitionMap) {
	const disabledLogic = definition?.["uesio.enable"] as
		| DisplayCondition[]
		| undefined

	const uesio = useUesio({ context })
	if (disabledLogic?.length) {
		for (const condition of disabledLogic) {
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

export { shouldEnable }
