import { Context } from "../../context/context"
import { ThunkFunc } from "../../store/store"
import { set as setPanel } from "."
import { selectors } from "./adapter"

const Operations: Record<
	string,
	(context: Context, panel: string) => ThunkFunc
> = {
	toggle: (context, panel) => async (dispatch, getState) => {
		const panelState = selectors.selectById(getState(), panel)
		dispatch(
			setPanel({
				id: panel,
				context: panelState?.context ? undefined : context.stack,
			})
		)
		return context
	},
	close: (context, panel) => async (dispatch) => {
		dispatch(
			setPanel({
				id: panel,
				context: undefined,
			})
		)
		return context
	},
	open: (context, panel) => async (dispatch) => {
		dispatch(
			setPanel({
				id: panel,
				context: context.stack,
			})
		)
		return context
	},
}

export default Operations
