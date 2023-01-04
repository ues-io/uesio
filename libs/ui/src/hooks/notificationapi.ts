import { Context } from "../context/context"
import { run } from "../signals/signals"

const addError = (text: string, context: Context, path?: string) =>
	run(
		{
			signal: "notification/ADD",
			severity: "error",
			text,
			path,
		},
		context
	)

const addNotification = (
	text: string,
	severity: string,
	context: Context,
	path?: string
) =>
	run(
		{
			signal: "notification/ADD",
			severity,
			text,
			path,
		},
		context
	)

export { addError, addNotification }
