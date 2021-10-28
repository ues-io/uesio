import { FunctionComponent, useState } from "react"
import { definition, hooks, component } from "@uesio/ui"

const TitleBar = component.registry.getUtility("io.titlebar")
const Button = component.registry.getUtility("io.button")
const Dialog = component.registry.getUtility("io.dialog")
const CheckboxField = component.registry.getUtility("io.checkboxfield")

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

	console.log("Values", values)

	const [state, setState] = useState({
		selected: "",
		value: false,
	})

	if (!values) {
		return null
	}

	const handleClickOpen = (key: string, value: boolean) => {
		setState({
			selected: key,
			value,
		})
	}

	const handleClose = () => {
		setState({
			selected: "",
			value: false,
		})
	}

	const handleSet = async () => {
		await uesio.featureflag.set(newContext, state.selected, state.value)
		resetValues()
		handleClose()
	}

	return (
		<>
			{values?.map((response) => {
				const key = `${response.namespace}.${response.name}`
				const value = response.value
				return (
					<TitleBar
						title={key}
						subtitle={value}
						context={context}
						styles={{
							root: {
								marginBottom: "20px",
							},
						}}
						actions={
							<Button
								onClick={() => handleClickOpen(key, value)}
								variant="io.secondary"
								context={context}
								label={`Set`}
							/>
						}
					/>
				)
			})}
			{state.selected !== "" && (
				<component.Panel context={context}>
					<Dialog
						width="400px"
						height="300px"
						onClose={handleClose}
						context={context}
						title={"Set Feature Flag "}
						actions={
							<Button
								label="Set"
								onClick={handleSet}
								variant="io.secondary"
								context={context}
							/>
						}
					>
						{state.selected}

						<CheckboxField
							context={context}
							label="Value"
							value={state.value}
							setValue={(value: boolean) =>
								setState({
									...state,
									value,
								})
							}
						/>
					</Dialog>
				</component.Panel>
			)}
		</>
	)
}

export default ConfigFeatureFlags
