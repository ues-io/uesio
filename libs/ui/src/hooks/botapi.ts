import { useEffect, useRef, useState } from "react"
import { AnyAction } from "redux"
import { Context } from "../context/context"
import { ParamDefinitionMap } from "../definition/param"
import { BotParams, platform } from "../platform/platform"
import { Dispatcher } from "../store/store"
import { Uesio } from "./hooks"

class BotAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<AnyAction>

	useParams(context: Context, namespace: string, name: string, type: string) {
		const [params, setParams] = useState<ParamDefinitionMap | undefined>(
			undefined
		)
		const loading = useRef(false)
		useEffect(() => {
			if (!params && !loading.current) {
				;(async () => {
					loading.current = true
					const response = await platform.getBotParams(
						context,
						namespace,
						name,
						type
					)
					setParams(response)
				})()
			}
		}, [])

		return params
	}
	async callGenerator(
		context: Context,
		namespace: string,
		name: string,
		params: BotParams
	) {
		return platform.callGeneratorBot(context, namespace, name, params)
	}
}

export { BotAPI }
