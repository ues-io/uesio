import { useEffect, useRef, useState } from "react"
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
	dispatcher: Dispatcher

	useSecrets(context: Context) {
		const [secrets, setSecrets] = useState<SecretResponse[] | null>(null)
		const loading = useRef(false)
		useEffect(() => {
			if (!secrets && !loading.current) {
				loading.current = true
				this.dispatcher((dispatch, getState, platform) =>
					platform.getSecrets(context)
				)
					.then(setSecrets)
					.finally(() => (loading.current = false))
			}
		})
		const reset = () => setSecrets(null)
		return [secrets, reset] as [SecretResponse[] | null, () => void]
	}

	set(context: Context, key: string, value: string) {
		return this.dispatcher((dispatch, getState, platform) =>
			platform.setSecret(context, key, value)
		)
	}
}

export { SecretAPI }
