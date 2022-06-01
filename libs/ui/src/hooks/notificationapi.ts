import { Context } from "../context/context"
import { Uesio } from "./hooks"

class NotificationAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

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
