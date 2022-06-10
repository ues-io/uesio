import { Context } from "../../../context/context"
import { unmarkForDelete } from ".."
import { ThunkFunc } from "../../..//store/store"

export default (context: Context): ThunkFunc =>
	(dispatch) => {
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
