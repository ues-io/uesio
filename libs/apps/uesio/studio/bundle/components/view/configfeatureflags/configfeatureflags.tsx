import { FunctionComponent } from "react"
import { definition, hooks } from "@uesio/ui"
import ConfigFeatureFlagsItem from "./configfeatureflagsitem"

type ConfigFeatureFlagsDefinition = {
	user: string
}
interface Props extends definition.BaseProps {
	definition: ConfigFeatureFlagsDefinition
}

const ConfigFeatureFlags: FunctionComponent<Props> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context, definition } = props
	const user = definition?.user ? definition?.user : ""
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

	const [values] = uesio.featureflag.useFeatureFlags(newContext, user)

	if (!values) {
		return null
	}

	const handleSet = async (key: string, value: boolean) => {
		await uesio.featureflag.set(newContext, key, value, user)
	}

	return (
		<>
			{values?.map((response, i) => {
				const key = `${response.namespace}.${response.name}`
				const value = response.value
				return (
					<ConfigFeatureFlagsItem
						key={`${key}.${i}`}
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
