import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { cancel, getFullWireId, getWiresFromDefinitonOrContext } from ".."

export default (context: Context, wireName: string) => {
  const wire = getWiresFromDefinitonOrContext(wireName, context)[0]
  dispatch(cancel({ entity: getFullWireId(wire.view, wire.name) }))

  // Run wire events
  context.getWire(wire.name)?.handleEvent("onCancel", context)

  return context
}
