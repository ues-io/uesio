import { FunctionComponent } from "react"
import { definition, hooks } from "@uesio/ui"
import ConfigFeatureFlagsItem from "./configfeatureflagsitem"

const ConfigFeatureFlags: FunctionComponent<definition.BaseProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context } = props
	const view = context.getView()
	const workspaceName = view?.params?.workspacename
	const appName = view?.params?.appname
	const siteName = view?.params?.sitename

	let newContext = props.context

	if (appName) {
		if (workspaceName) {
			newContext = props.context.addFrame({
				workspace: {
					name: workspaceName,
					app: appName,
				},
			})
		}
		if (siteName) {
			newContext = props.context.addFrame({
				siteadmin: {
					name: siteName,
					app: appName,
				},
			})
		}
	}

	const [values, resetValues] = uesio.featureflag.useFeatureFlags(newContext)

	if (!values) {
		return null
	}

	const handleSet = async (key: string, value: boolean) => {
		await uesio.featureflag.set(newContext, key, value)
	}

	return (
		<>
			{values?.map((response) => {
				const key = `${response.namespace}.${response.name}`
				const value = response.value
				return (
					<ConfigFeatureFlagsItem
						title={key}
						value={value}
						context={newContext}
						handleSet={handleSet}
					/>
				)
			})}
		</>
	)
}

export default ConfigFeatureFlags
