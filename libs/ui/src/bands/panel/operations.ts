import { Context } from "../../context/context"
import { dispatch, getCurrentState } from "../../store/store"
import { upsertOne, removeOne, removeAll } from "."
import { selectors } from "./adapter"

const open = (context: Context, panel: string) => {
	dispatch(
		upsertOne({
			id: panel,
			context: context.stack,
		})
	)
	return context
}

const close = (context: Context, panel: string) => {
	dispatch(removeOne(panel))
	return context
}

const toggle = (context: Context, panel: string) => {
	const panelState = selectors.selectById(getCurrentState(), panel)
	return panelState ? close(context, panel) : open(context, panel)
}

const closeAll = (context: Context) => {
	dispatch(removeAll())
	return context
}

export { open, close, toggle, closeAll }
