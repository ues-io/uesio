import { Context } from "../../../context/context"
import loadNextBatchOp from "./loadnextbatch"
import { selectWire } from ".."
import { getCurrentState } from "../../../store/store"

const loadAllOp = async (context: Context, wires?: string[]) => {
  // Turn the list of wires into a load request
  const viewId = context.getViewId()
  if (!viewId) throw new Error("No ViewId in Context")

  // Get the wires that still need to be loaded
  const loadWires = wires?.filter((wireName) => {
    const wire = selectWire(getCurrentState(), viewId, wireName)
    return wire?.more
  })

  if (!loadWires || loadWires.length === 0) return context

  await loadNextBatchOp(context, loadWires)
  await loadAllOp(context, loadWires)
  return context
}

export default loadAllOp
