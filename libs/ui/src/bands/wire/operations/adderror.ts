import { Context } from "../../../context/context"
import { addError } from ".."
import { ThunkFunc } from "../../../store/store"

export default (
		context: Context,
		fieldId: string,
		message: string
	): ThunkFunc =>
	(dispatch) => {
		const recordId = context.getRecord()?.getId()
		const wire = context.getWire()
		if (!recordId || !wire) return context
		dispatch(
			addError({
				entity: wire.getFullId(),
				recordId,
				fieldId,
				message,
			})
		)
		return context
	}
