import { Context } from "../../context/context"
import { ThunkFunc } from "../../store/store"
import { set as setPanel } from "."
import { selectors } from "./adapter"

const toggle = (
	context: Context,
	panel: string,
	contextPath: string
): ThunkFunc => async (dispatch, getState) => {
	const state = getState()
	const panelState = selectors.selectById(state, panel)
	if (!panelState) return context
	dispatch(
		setPanel({
			id: panel,
			contextPath,
			type: panelState.type,
			open: !panelState.open,
		})
	)
	return context
}

export default {
	toggle,
}
