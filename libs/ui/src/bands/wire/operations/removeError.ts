import { Context } from "../../../context/context"
import { removeError } from ".."
import { ThunkFunc } from "../../../store/store"

export default (context: Context, fieldId: string): ThunkFunc =>
	(dispatch) => {
		const recordId = context.getRecord()?.getId()
		const wire = context.getWire()
		if (!recordId || !wire) return context
		dispatch(
			removeError({
				entity: wire.getFullId(),
				recordId,
				fieldId,
			})
		)
		return context
	}
