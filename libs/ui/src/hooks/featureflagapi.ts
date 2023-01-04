import { useEffect, useRef, useState } from "react"
import { Context } from "../context/context"
import { FeatureFlagResponse, platform } from "../platform/platform"

const useFeatureFlags = (context: Context, user: string) => {
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
	return [featureflags, reset] as [FeatureFlagResponse[] | null, () => void]
}

const set = platform.setFeatureFlag

export { useFeatureFlags, set }
