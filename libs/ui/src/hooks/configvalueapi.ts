import { useEffect, useRef, useState } from "react"
import { AnyAction } from "redux"
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
	dispatcher: Dispatcher<AnyAction>

	useConfigValues(context: Context, app?: string, site?: string) {
		const [values, setValues] = useState<ConfigValueResponse[] | null>(null)
		const loading = useRef(false)
		useEffect(() => {
			if (!values && !loading.current) {
				loading.current = true
				this.dispatcher((dispatch, getState, platform) =>
					platform.getConfigValues(context, app, site)
				)
					.then(setValues)
					.finally(() => (loading.current = false))
			}
		})
		return values
	}
}

export { ConfigValueAPI }
