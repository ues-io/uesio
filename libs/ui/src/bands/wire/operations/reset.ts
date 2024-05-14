import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { reset, getFullWireId, getWiresFromDefinitonOrContext } from ".."
import { batch } from "react-redux"
import { createRecordOp } from "./createrecord"

export default (context: Context, wireName: string) => {
	const wire = getWiresFromDefinitonOrContext(wireName, context)[0]

	batch(() => {
		dispatch(
			reset({
				entity: getFullWireId(wire.view, wire.name),
			})
		)
		if (wire.create) {
			createRecordOp({ context, wireName })
		}
	})

	return context
}
