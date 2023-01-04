import { Context } from "../../context/context"
import { dispatch, getCurrentState } from "../../store/store"
import { set as setPanel } from "."
import { selectors } from "./adapter"

const Operations: Record<string, (context: Context, panel: string) => Context> =
	{
		toggle: (context, panel) => {
			const panelState = selectors.selectById(getCurrentState(), panel)
			dispatch(
				setPanel({
					id: panel,
					context: panelState?.context ? undefined : context.stack,
				})
			)
			return context
		},
		close: (context, panel) => {
			dispatch(
				setPanel({
					id: panel,
					context: undefined,
				})
			)
			return context
		},
		open: (context, panel) => {
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
