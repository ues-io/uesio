import { Context } from "../../../context/context"
import { addError } from ".."
import { dispatch } from "../../../store/store"

export default (context: Context, fieldId: string, message: string) => {
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
