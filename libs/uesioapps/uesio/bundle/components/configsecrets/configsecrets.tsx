import React, { FunctionComponent } from "react"
import { definition, hooks, material } from "@uesio/ui"

type PermissionPickerDefinition = {
	app: string
	site: string
}

interface Props extends definition.BaseProps {
	definition: PermissionPickerDefinition
}

const ConfigSecrets: FunctionComponent<Props> = (props) => {
	const uesio = hooks.useUesio(props)
	const { context } = props
	const view = context.getView()
	const workspaceName = view?.params?.workspacename
	const appName = view?.params?.appname
	const siteName = view?.params?.sitename

	if (appName) {
		if (workspaceName) {
			uesio.addContextFrame({
				workspace: {
					name: workspaceName,
					app: appName,
				},
			})
		}
		if (siteName) {
			uesio.addContextFrame({
				siteadmin: {
					name: siteName,
					app: appName,
				},
			})
		}
	}
	const [configValues, resetConfigValues] = uesio.configvalue.useConfigValues(
		props.context
	)
	const [secrets, resetSecrets] = uesio.secret.useSecrets(props.context)
	const [state, setState] = React.useState({
		selected: "",
		value: "",
		isSecret: false,
	})

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
		await api.set(context, state.selected, state.value)
		state.isSecret ? resetSecrets() : resetConfigValues()
		handleClose()
	}

	return (
		<>
			<material.List
				subheader={
					<material.ListSubheader disableSticky>
						{"Config Values"}
					</material.ListSubheader>
				}
				dense
			>
				{configValues?.map((configValue) => {
					const key = `${configValue.namespace}.${configValue.name}`
					const value = configValue.value
					return (
						<material.ListItem divider>
							<material.ListItemText
								id={key}
								primary={key}
								secondary={value}
							/>
							{(configValue.managedby !== "app" ||
								configValue.namespace === appName) && (
								<material.ListItemSecondaryAction>
									<material.Button
										onClick={() =>
											handleClickOpen(key, value, false)
										}
									>
										{`Set${
											configValue.managedby === "app"
												? " for App"
												: ""
										}`}
									</material.Button>
								</material.ListItemSecondaryAction>
							)}
						</material.ListItem>
					)
				})}
			</material.List>
			<material.List
				subheader={
					<material.ListSubheader disableSticky>
						{"Secrets"}
					</material.ListSubheader>
				}
				dense
			>
				{secrets?.map((secret) => {
					const key = `${secret.namespace}.${secret.name}`
					return (
						<material.ListItem divider>
							<material.ListItemText
								id={key}
								primary={key}
								secondary={"********"}
							/>
							{(secret.managedby !== "app" ||
								secret.namespace === appName) && (
								<material.ListItemSecondaryAction>
									<material.Button
										onClick={() =>
											handleClickOpen(key, "", true)
										}
									>
										{`Set${
											secret.managedby === "app"
												? " for App"
												: ""
										}`}
									</material.Button>
								</material.ListItemSecondaryAction>
							)}
						</material.ListItem>
					)
				})}
			</material.List>
			<material.Dialog
				fullWidth
				open={state.selected !== ""}
				onClose={handleClose}
				aria-labelledby="alert-dialog-title"
				aria-describedby="alert-dialog-description"
			>
				<material.DialogTitle id="alert-dialog-title">
					{"Set " + (state.isSecret ? "Secret" : "Config Value")}
				</material.DialogTitle>
				<material.DialogContent>
					<material.DialogContentText>
						{state.selected}
					</material.DialogContentText>
					<material.TextField
						autoFocus
						margin="dense"
						id="value"
						label="Value"
						value={state.value}
						fullWidth
						onChange={(event) =>
							setState({
								...state,
								value: event.target.value,
							})
						}
					/>
				</material.DialogContent>
				<material.DialogActions>
					<material.Button onClick={handleSet} color="primary">
						Set
					</material.Button>
				</material.DialogActions>
			</material.Dialog>
		</>
	)
}

export default ConfigSecrets
