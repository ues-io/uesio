import { Context } from "../../context/context"
import { dispatch } from "../../store/store"
import { upsertOne, removeOne, removeAll } from "."
import { DefinitionMap } from "../../definition/definition"
import { PanelState } from "./types"

const open = (
	context: Context,
	panel: string,
	state: PanelState | undefined,
	definition?: DefinitionMap
) => {
	if (state) {
		// If it already exists, just keep it open
		dispatch(
			upsertOne({
				id: panel,
				context: context.stack,
				closed: false,
			})
		)
		return context
	}
	dispatch(
		upsertOne({
			id: panel,
			context: context.stack,
			definition,
			closed: true,
		})
	)
	// Give it some time to do animations
	setTimeout(() => {
		dispatch(
			upsertOne({
				id: panel,
				context: context.stack,
				closed: false,
			})
		)
	}, 1)
	return context
}

const close = (
	context: Context,
	panel: string,
	state: PanelState | undefined
) => {
	if (state?.closed) {
		// If it's already closed, just kill it.
		dispatch(removeOne(panel))
		return context
	}
	dispatch(
		upsertOne({
			id: panel,
			context: context.stack,
			closed: true,
		})
	)
	setTimeout(() => {
		dispatch(removeOne(panel))
	}, 300)

	return context
}

const closeAll = (context: Context) => {
	dispatch(removeAll())
	return context
}

export { open, close, closeAll }
