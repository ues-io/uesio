import { Context } from "../../../context/context"
import markForDeleteOp from "./markfordelete"
import unmarkForDeleteOp from "./unmarkfordelete"

export default (context: Context) => {
	const record = context.getRecord()
	const wire = context.getWire()

	if (!record || !wire) return context

	const recordId = record.getId()
	const isDeleted = wire.isMarkedForDeletion(recordId)

	return isDeleted ? unmarkForDeleteOp(context) : markForDeleteOp(context)
}
