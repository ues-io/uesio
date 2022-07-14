import { Context } from "../context/context"
import { DefinitionMap } from "../definition/definition"
import { useUesio } from "../hooks/hooks"
import { should, DisplayCondition } from "./display"

function shouldDisable(context: Context, definition?: DefinitionMap) {
	const disabledLogic = definition?.["uesio.disable"] as
		| DisplayCondition[]
		| undefined

	const uesio = useUesio({ context })
	if (disabledLogic?.length) {
		for (const condition of disabledLogic) {
			// Weird hack for now
			if (!condition.type && condition.wire) {
				uesio.wire.useWire(condition.wire)
			}

			const test = !should(condition, context)
			console.log("TEST: " + test)

			if (!should(condition, context)) {
				return true
			}
		}
	}
	return false
}

export { shouldDisable }
