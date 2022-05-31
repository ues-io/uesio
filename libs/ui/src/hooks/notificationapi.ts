import { Context } from "../context/context"
import { Dispatcher } from "../store/store"
import { Uesio } from "./hooks"

class NotificationAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher

	addError(text: string, context?: Context, path?: string) {
		return this.uesio.signal.run(
			{
				signal: "notification/ADD",
				severity: "error",
				text,
				path,
			},
			context || this.uesio.getContext()
		)
	}

	addNotification(
		text: string,
		severity: string,
		context?: Context,
		path?: string
	) {
		return this.uesio.signal.run(
			{
				signal: "notification/ADD",
				severity,
				text,
				path,
			},
			context || this.uesio.getContext()
		)
	}
}

export { NotificationAPI }
