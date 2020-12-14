import { AnyAction } from "@reduxjs/toolkit"
import { Context } from "../../../context/context"
import { markForDelete } from ".."
import { Dispatcher } from "../../..//store/store"

export default (context: Context) => async (
	dispatch: Dispatcher<AnyAction>
) => {
	const recordId = context.getRecord()?.getId()
	const wire = context.getWire()
	const idField = wire?.collection.getIdField()?.getId()

	if (!recordId || !idField || !wire) return context

	dispatch(
		markForDelete({
			entity: wire.getFullId(),
			idField,
			recordId,
		})
	)
	return context
}
