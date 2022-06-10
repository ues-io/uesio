import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { cancel, getWiresFromDefinitonOrContext } from ".."

export default (context: Context, wirename: string): ThunkFunc =>
	(dispatch) => {
		const wireToCancel = getWiresFromDefinitonOrContext(
			wirename,
			context
		)[0]

		dispatch(
			cancel({ entity: `${wireToCancel.view}/${wireToCancel.name}` })
		)
		return context
	}
