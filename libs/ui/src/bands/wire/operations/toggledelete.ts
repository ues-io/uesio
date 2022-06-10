import { Context } from "../../../context/context"
import markForDeleteOp from "./markfordelete"
import unmarkForDeleteOp from "./unmarkfordelete"
import { ThunkFunc } from "../../..//store/store"

export default (context: Context): ThunkFunc =>
	(dispatch) => {
		const record = context.getRecord()
		const wire = context.getWire()

		if (!record || !wire) return context

		const recordId = record.getId()
		const isDeleted = wire.isMarkedForDeletion(recordId)

		return dispatch(
			isDeleted ? unmarkForDeleteOp(context) : markForDeleteOp(context)
		)
	}
