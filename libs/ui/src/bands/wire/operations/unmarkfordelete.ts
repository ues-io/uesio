import { Context } from "../../../context/context"
import { unmarkForDelete } from ".."
import { dispatch } from "../../../store/store"

export default (context: Context, wireId: string) => {
	const record = context.getRecord(wireId)

	if (!record) return context

	dispatch(
		unmarkForDelete({
			entity: record.getWire().getFullId(),
			recordId: record.getId(),
		})
	)
	return context
}
