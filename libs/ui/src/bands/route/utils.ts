import { AnyAction } from "redux"
import { ThunkDispatch } from "redux-thunk"
import { platform, Platform } from "../../platform/platform"
import { RootState } from "../../store/store"
import { Dependencies } from "./types"
import { setMany as setComponentVariant } from "../componentvariant"
import { setMany as setConfigValue } from "../configvalue"
import { setMany as setLabel } from "../label"
import { setMany as setViewDef } from "../viewdef"
import { setMany as setTheme } from "../theme"
import { setMany as setMetadataText } from "../metadatatext"
import { setMany as setFeatureFlag } from "../featureflag"
import { setNamespaceInfo } from "../builder"
import { PlainViewDef } from "../../definition/viewdef"
import { ComponentVariant } from "../../definition/componentvariant"
import { ConfigValueState } from "../../definition/configvalue"
import { LabelState } from "../../definition/label"
import { Context } from "../../context/context"
import { parseKey } from "../../component/path"
import { ThemeState } from "../../definition/theme"
import { MetadataState } from "../metadata/types"
import { FeatureFlagState } from "../../definition/featureflag"

type Dep<T> = Record<string, T> | undefined

const dispatchRouteDeps = (
	deps: Dependencies | undefined,
	dispatch: ThunkDispatch<RootState, Platform, AnyAction>
) => {
	if (!deps) return

	const entities = deps.viewdef?.entities as Dep<PlainViewDef>
	if (entities) dispatch(setViewDef(entities))

	const configvalues = deps.configvalue?.entities as Dep<ConfigValueState>
	if (configvalues) dispatch(setConfigValue(configvalues))

	const featureflags = deps.featureflag?.entities as Dep<FeatureFlagState>
	if (featureflags) dispatch(setFeatureFlag(featureflags))

	const labels = deps.label?.entities as Dep<LabelState>
	if (labels) dispatch(setLabel(labels))

	const variants = deps.componentvariant?.entities as Dep<ComponentVariant>
	if (variants) dispatch(setComponentVariant(variants))

	const themes = deps.theme?.entities as Dep<ThemeState>
	if (themes) dispatch(setTheme(themes))

	const metadatatext = deps.metadatatext?.entities as Dep<MetadataState>
	if (metadatatext) dispatch(setMetadataText(metadatatext))

	const namespaceinfo = deps.namespaces
	if (namespaceinfo) dispatch(setNamespaceInfo(namespaceinfo))
}

const getPackUrlsForDeps = (
	deps: Dependencies | undefined,
	context: Context,
	includeBuilder?: boolean
) =>
	deps?.componentpack?.ids.flatMap((key) =>
		getPackUrls(key as string, context, includeBuilder)
	) || []

const getPackUrls = (
	key: string,
	context: Context,
	includeBuilder?: boolean
) => {
	const [namespace, name] = parseKey(key as string)
	const runtime = platform.getComponentPackURL(context, namespace, name)
	if (!includeBuilder) return [runtime]

	const buildtime = platform.getComponentPackURL(
		context,
		namespace,
		name,
		true
	)
	return [runtime, buildtime]
}

export { dispatchRouteDeps, getPackUrlsForDeps, getPackUrls }
