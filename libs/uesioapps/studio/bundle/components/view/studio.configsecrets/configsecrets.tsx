import { FunctionComponent, useState } from "react"
import { definition, hooks, component } from "@uesio/ui"
import { createPortal } from "react-dom"

const TitleBar = component.registry.getUtility("io.titlebar")
const Button = component.registry.getUtility("io.button")
const Dialog = component.registry.getUtility("io.dialog")
const TextField = component.registry.getUtility("io.textfield")

const ConfigSecrets: FunctionComponent<definition.BaseProps> = (props) => {
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
	const [configValues, resetConfigValues] = uesio.configvalue.useConfigValues(
		newContext
	)
	const [secrets, resetSecrets] = uesio.secret.useSecrets(newContext)
	const [state, setState] = useState({
		selected: "",
		value: "",
		isSecret: false,
	})

	const portalNode = hooks.usePortal()

	if (!configValues || !secrets) {
		return null
	}

	const handleClickOpen = (key: string, value: string, isSecret: boolean) => {
		setState({
			selected: key,
			value,
			isSecret,
		})
	}

	const handleClose = () => {
		setState({
			selected: "",
			value: "",
			isSecret: false,
		})
	}

	const handleSet = async () => {
		const api = state.isSecret ? uesio.secret : uesio.configvalue
		await api.set(newContext, state.selected, state.value)
		state.isSecret ? resetSecrets() : resetConfigValues()
		handleClose()
	}

	return (
		<>
			<TitleBar
				title="Config Values"
				variant="io.section"
				context={context}
			/>

			{configValues?.map((configValue) => {
				const key = `${configValue.namespace}.${configValue.name}`
				const value = configValue.value
				return (
					<TitleBar
						title={key}
						subtitle={value}
						context={context}
						variant="io.nav"
						actions={
							<Button
								onClick={() =>
									handleClickOpen(key, value, false)
								}
								variant="io.secondary"
								context={context}
								label={`Set${
									configValue.managedby === "app"
										? " for App"
										: ""
								}`}
							/>
						}
					/>
				)
			})}

			<TitleBar title="Secrets" variant="io.section" context={context} />

			{secrets?.map((secret) => {
				const key = `${secret.namespace}.${secret.name}`
				return (
					<TitleBar
						title={key}
						subtitle="*********"
						context={context}
						variant="io.nav"
						actions={
							<Button
								onClick={() => handleClickOpen(key, "", true)}
								variant="io.secondary"
								context={context}
								label={`Set${
									secret.managedby === "app" ? " for App" : ""
								}`}
							/>
						}
					/>
				)
			})}
			{state.selected !== "" &&
				createPortal(
					<Dialog
						width="400px"
						height="300px"
						onClose={handleClose}
						context={context}
						title={
							"Set " +
							(state.isSecret ? "Secret" : "Config Value")
						}
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
					</Dialog>,
					portalNode
				)}
		</>
	)
}

export default ConfigSecrets
