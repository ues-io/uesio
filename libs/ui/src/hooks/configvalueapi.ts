import { useEffect, useRef, useState } from "react"
import { Context } from "../context/context"
import { ConfigValueResponse } from "../platform/platform"
import { Dispatcher } from "../store/store"
import { Uesio } from "./hooks"

class ConfigValueAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher

	useConfigValues(context: Context) {
		const [values, setValues] = useState<ConfigValueResponse[] | null>(null)
		const loading = useRef(false)
		useEffect(() => {
			if (!values && !loading.current) {
				loading.current = true
				this.dispatcher((dispatch, getState, platform) =>
					platform.getConfigValues(context)
				)
					.then(setValues)
					.finally(() => (loading.current = false))
			}
		})
		const reset = () => setValues(null)
		return [values, reset] as [ConfigValueResponse[] | null, () => void]
	}

	set(context: Context, key: string, value: string) {
		return this.dispatcher((dispatch, getState, platform) =>
			platform.setConfigValue(context, key, value)
		)
	}
}

export { ConfigValueAPI }
