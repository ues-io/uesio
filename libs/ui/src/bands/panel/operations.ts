import { Context } from "../../context/context"
import { dispatch } from "../../store/store"
import { upsertOne, removeOne, removeAll } from "."

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

const closeAll = (context: Context) => {
	dispatch(removeAll())
	return context
}

export { open, close, closeAll }
