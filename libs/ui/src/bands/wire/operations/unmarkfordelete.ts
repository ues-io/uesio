import { AnyAction } from "@reduxjs/toolkit"
import { Context } from "../../../context/context"
import { unmarkForDelete } from ".."
import { Dispatcher } from "../../..//store/store"
import { AppThunk } from "../../../store/types/runtimestate"

export default (context: Context): AppThunk<Promise<Context>> => async (
	dispatch: Dispatcher<AnyAction>
) => {
	const recordId = context.getRecord()?.getId()
	const wire = context.getWire()

	if (!recordId || !wire) return context

	dispatch(
		unmarkForDelete({
			entity: wire.getFullId(),
			recordId,
		})
	)
	return context
}
