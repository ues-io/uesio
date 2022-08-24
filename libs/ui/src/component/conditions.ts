import { DisplayCondition, should } from "../component/display"
import { Context } from "../context/context"
import { DefinitionMap } from "../definition/definition"
import { useUesio } from "../hooks/hooks"

//TO-DO this can be resued from the display one sending in the specialPropsKey
function useFilterByConditions(context: Context, definition?: DefinitionMap) {
	const conditions = definition?.["uesio.filter"] as
		| DisplayCondition[]
		| undefined

	const uesio = useUesio({ context })
	// Create a list of all of the wires that we're going to care about
	const contextWire = context.getWireId()
	const wireNames = contextWire ? [contextWire] : []

	let result = true

	if (conditions?.length) {
		for (const condition of conditions) {
			// Weird hack for now
			if (!condition.type && condition.wire) {
				wireNames.push(condition.wire)
			}
			if (!should(condition, context)) {
				result = false
				break
			}
		}
	}

	// We need to subscribe to changes on these wires
	uesio.wire.useWires(wireNames)

	return result
}

export { useFilterByConditions }
