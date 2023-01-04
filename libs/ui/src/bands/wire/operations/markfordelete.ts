import { Context } from "../../../context/context"
import { markForDelete } from ".."
import { dispatch } from "../../..//store/store"

export default (context: Context) => {
	const recordId = context.getRecord()?.getId()
	const wire = context.getWire()

	if (!recordId || !wire) return context

	dispatch(
		markForDelete({
			entity: wire.getFullId(),
			recordId,
		})
	)
	return context
}
