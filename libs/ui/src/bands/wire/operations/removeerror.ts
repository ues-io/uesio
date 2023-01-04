import { Context } from "../../../context/context"
import { dispatch } from "../../../store/store"
import { removeError } from ".."

const wireRemoveError = (context: Context, fieldId: string) => {
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

export default wireRemoveError
