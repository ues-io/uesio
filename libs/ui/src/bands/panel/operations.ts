import { Context } from "../../context/context"
import { ThunkFunc } from "../../store/store"
import { set as setPanel } from "."
import { selectors } from "./adapter"

const toggle =
	(context: Context, panel: string): ThunkFunc =>
	async (dispatch, getState) => {
		const panelState = selectors.selectById(getState(), panel)
		dispatch(
			setPanel({
				id: panel,
				context: panelState?.context ? undefined : context,
			})
		)
		return context
	}

const close =
	(context: Context, panel: string): ThunkFunc =>
	async (dispatch) => {
		dispatch(
			setPanel({
				id: panel,
				context: undefined,
			})
		)
		return context
	}

const open =
	(context: Context, panel: string): ThunkFunc =>
	async (dispatch) => {
		dispatch(
			setPanel({
				id: panel,
				context,
			})
		)
		return context
	}

export default {
	toggle,
	open,
	close,
}
