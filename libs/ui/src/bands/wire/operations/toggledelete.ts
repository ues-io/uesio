import { AnyAction } from "@reduxjs/toolkit"
import { Context } from "../../../context/context"
import markForDeleteOp from "./markfordelete"
import unmarkForDeleteOp from "./unmarkfordelete"
import { Dispatcher } from "../../../store/store"
import { AppThunk } from "../../../store/types/runtimestate"

export default (context: Context): AppThunk<Promise<Context>> => async (
	dispatch: Dispatcher<AnyAction>
) => {
	const record = context.getRecord()
	const wire = context.getWire()

	if (!record || !wire) return context

	const recordId = record.getId()
	const isDeleted = wire.isMarkedForDeletion(recordId)

	return isDeleted
		? unmarkForDeleteOp(context)(dispatch)
		: markForDeleteOp(context)(dispatch)
}
