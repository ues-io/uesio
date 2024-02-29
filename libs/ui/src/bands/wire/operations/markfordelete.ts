import { Context } from "../../../context/context"
import { markForDelete } from ".."
import { dispatch } from "../../..//store/store"
import { batch } from "react-redux"

export default (context: Context, wireId: string) => {
	const records = context.getRecords(wireId)

	if (!records) return context

	batch(() => {
		for (const record of records) {
			dispatch(
				markForDelete({
					entity: record.getWire().getFullId(),
					recordId: record.getId(),
				})
			)
		}
	})
	return context
}
