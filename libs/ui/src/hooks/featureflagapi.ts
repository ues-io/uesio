import { useEffect, useRef, useState } from "react"
import { Context } from "../context/context"
import { FeatureFlagResponse, platform } from "../platform/platform"
import { Uesio } from "./hooks"

class FeatureFlagAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	useFeatureFlags(context: Context, user: string) {
		const [featureflags, setFeatureFlags] = useState<
			FeatureFlagResponse[] | null
		>(null)
		const loading = useRef(false)
		useEffect(() => {
			if (!featureflags && !loading.current) {
				loading.current = true
				platform
					.getFeatureFlags(context, user)
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
		return platform.setFeatureFlag(context, key, value, user)
	}
}

export { FeatureFlagAPI }
