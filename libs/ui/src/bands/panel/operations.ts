import { Context } from "../../context/context"
import { ThunkFunc } from "../../store/store"
import { set as setPanel } from "."
import { selectors } from "./adapter"

const toggle =
	(context: Context, panel: string, contextPath: string): ThunkFunc =>
	async (dispatch, getState) => {
		const panelState = selectors.selectById(getState(), panel)
		dispatch(
			setPanel({
				id: panel,
				contextPath: panelState?.contextPath ? "" : contextPath,
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
				contextPath: "",
			})
		)
		return context
	}

const open =
	(context: Context, panel: string, contextPath: string): ThunkFunc =>
	async (dispatch) => {
		dispatch(
			setPanel({
				id: panel,
				contextPath,
			})
		)
		return context
	}

export default {
	toggle,
	open,
	close,
}
