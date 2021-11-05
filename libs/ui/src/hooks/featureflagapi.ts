import { useEffect, useRef, useState } from "react"
import { AnyAction } from "redux"
import { Context } from "../context/context"
import { FeatureFlagResponse } from "../platform/platform"
import { Dispatcher } from "../store/store"
import { Uesio } from "./hooks"

class FeatureFlagAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
		this.dispatcher = uesio.getDispatcher()
	}

	uesio: Uesio
	dispatcher: Dispatcher<AnyAction>

	useFeatureFlags(context: Context, user: string) {
		const [featureflags, setFeatureFlags] = useState<
			FeatureFlagResponse[] | null
		>(null)
		const loading = useRef(false)
		useEffect(() => {
			if (!featureflags && !loading.current) {
				loading.current = true
				this.dispatcher((dispatch, getState, platform) =>
					platform.getFeatureFlags(context, user)
				)
					.then(setFeatureFlags)
					.finally(() => (loading.current = false))
			}
		})
		const reset = () => setFeatureFlags(null)
		return [featureflags, reset] as [
			FeatureFlagResponse[] | null,
			() => void
		]
	}

	set(context: Context, key: string, value: boolean, user?: string) {
		return this.dispatcher((dispatch, getState, platform) =>
			platform.setFeatureFlag(context, key, value, user)
		)
	}
}

export { FeatureFlagAPI }
