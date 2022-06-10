import { Context } from "../../../context/context"
import { markForDelete } from ".."
import { ThunkFunc } from "../../..//store/store"

export default (context: Context): ThunkFunc =>
	(dispatch) => {
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
