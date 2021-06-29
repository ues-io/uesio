import { Dispatcher } from "../../../store/store"
import { Context } from "../../../context/context"
import { AnyAction } from "redux"
import { cancel } from ".."
import { getWiresFromDefinitonOrContext } from "../adapter"

export default (context: Context, wirename: string) =>
	(dispatch: Dispatcher<AnyAction>) => {
		const wireToCancel = getWiresFromDefinitonOrContext(
			wirename,
			context
		)[0]

		dispatch(
			cancel({ entity: `${wireToCancel.view}/${wireToCancel.name}` })
		)
		return context
	}
