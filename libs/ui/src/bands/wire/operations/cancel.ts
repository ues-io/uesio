import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { cancel, getFullWireId, getWiresFromDefinitonOrContext } from ".."
import { publish } from "../../../hooks/eventapi"

export default (context: Context, wirename: string) => {
	const wire = getWiresFromDefinitonOrContext(wirename, context)[0]
	const fullWireId = getFullWireId(wire.view, wire.name)
	dispatch(cancel({ entity: fullWireId }))

	// Run wire events
	context.getWire(wire.name)?.handleEvent("onCancel", context)

	// Publish events
	publish("wire.cancelled", {
		fullWireId,
	})
	return context
}
