import { Context } from "../../../context/context"
import { markForDelete } from ".."
import { dispatch } from "../../..//store/store"

export default (context: Context) => {
	const record = context.getRecord()

	if (!record) return context

	dispatch(
		markForDelete({
			entity: record.getWire().getFullId(),
			recordId: record.getId(),
		})
	)
	return context
}
