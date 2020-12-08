import { Context } from "../../../context/context"
import { unmarkForDelete } from ".."
import { Dispatcher } from "../../..//store/store"
import { AnyAction } from "@reduxjs/toolkit"

export default (context: Context) => async (
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
