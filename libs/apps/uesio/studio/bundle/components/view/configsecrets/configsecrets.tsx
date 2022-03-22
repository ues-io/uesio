import { FunctionComponent, useState } from "react"
import { definition, hooks, component } from "@uesio/ui"

const TitleBar = component.registry.getUtility("uesio/io.titlebar")
const Button = component.registry.getUtility("uesio/io.button")
const Dialog = component.registry.getUtility("uesio/io.dialog")
const TextField = component.registry.getUtility("uesio/io.textfield")

const ConfigSecrets: FunctionComponent<definition.BaseProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context } = props
	const view = context.getView()
	const workspaceName = view?.params?.workspacename
	const appName = view?.params?.app
	const siteName = view?.params?.sitename

	let newContext = props.context

	const valueType = props.definition?.valueType
	const isSecret = valueType !== "config"

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

	const [values, resetValues] = isSecret
		? uesio.secret.useSecrets(newContext)
		: uesio.configvalue.useConfigValues(newContext)

	const [state, setState] = useState({
		selected: "",
		value: "",
	})

	if (!values) {
		return null
	}

	const handleClickOpen = (key: string, value: string) => {
		setState({
			selected: key,
			value,
		})
	}

	const handleClose = () => {
		setState({
			selected: "",
			value: "",
		})
	}

	const handleSet = async () => {
		const api = isSecret ? uesio.secret : uesio.configvalue
		await api.set(newContext, state.selected, state.value)
		resetValues()
		handleClose()
	}

	return (
		<>
			{values?.map((response) => {
				const key = `${response.namespace}.${response.name}`
				const value = isSecret ? "*********" : response.value
				return (
					<TitleBar
						key={key}
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
								onClick={() =>
									handleClickOpen(key, isSecret ? "" : value)
								}
								variant="uesio/io.secondary"
								context={context}
								label={`Set${
									response.managedby === "app"
										? " for App"
										: ""
								}`}
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
						title={"Set " + (isSecret ? "Secret" : "Config Value")}
						actions={
							<Button
								label="Set"
								onClick={handleSet}
								variant="uesio/io.secondary"
								context={context}
							/>
						}
					>
						{state.selected}

						<TextField
							context={context}
							label="Value"
							value={state.value}
							setValue={(value: string) =>
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

export default ConfigSecrets
