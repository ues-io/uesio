import { useEffect, useRef, useState } from "react"
import { AnyAction } from "redux"
import { Context } from "../context/context"
import { SecretResponse } from "../platform/platform"
import { Dispatcher } from "../store/store"
import { Uesio } from "./hooks"

class SecretAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<AnyAction>

	useSecrets(context: Context, app?: string, site?: string) {
		const [secrets, setSecrets] = useState<SecretResponse[] | null>(null)
		const loading = useRef(false)
		useEffect(() => {
			if (!secrets && !loading.current) {
				loading.current = true
				this.dispatcher((dispatch, getState, platform) =>
					platform.getSecrets(context, app, site)
				)
					.then(setSecrets)
					.finally(() => (loading.current = false))
			}
		})
		return secrets
	}
}

export { SecretAPI }
