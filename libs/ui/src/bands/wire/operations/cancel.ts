import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { cancel, getFullWireId, getWiresFromDefinitonOrContext } from ".."

export default (context: Context, wirename: string): ThunkFunc =>
	(dispatch) => {
		const wire = getWiresFromDefinitonOrContext(wirename, context)[0]
		dispatch(cancel({ entity: getFullWireId(wire.view, wire.name) }))
		return context
	}
