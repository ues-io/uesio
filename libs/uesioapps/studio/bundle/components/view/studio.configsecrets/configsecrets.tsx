import { FunctionComponent, useState } from "react"
import { definition, hooks } from "@uesio/ui"
import {
	List,
	ListSubheader,
	ListItem,
	ListItemText,
	DialogContent,
	DialogActions,
	Dialog,
	DialogTitle,
	DialogContentText,
	TextField,
	ListItemSecondaryAction,
	Button,
} from "@material-ui/core"

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
			<List
				subheader={
					<ListSubheader disableSticky>
						{"Config Values"}
					</ListSubheader>
				}
				dense
			>
				{configValues?.map((configValue) => {
					const key = `${configValue.namespace}.${configValue.name}`
					const value = configValue.value
					return (
						<ListItem divider>
							<ListItemText
								id={key}
								primary={key}
								secondary={value}
							/>
							{(configValue.managedby !== "app" ||
								configValue.namespace === appName) && (
								<ListItemSecondaryAction>
									<Button
										onClick={() =>
											handleClickOpen(key, value, false)
										}
									>
										{`Set${
											configValue.managedby === "app"
												? " for App"
												: ""
										}`}
									</Button>
								</ListItemSecondaryAction>
							)}
						</ListItem>
					)
				})}
			</List>
			<List
				subheader={
					<ListSubheader disableSticky>{"Secrets"}</ListSubheader>
				}
				dense
			>
				{secrets?.map((secret) => {
					const key = `${secret.namespace}.${secret.name}`
					return (
						<ListItem divider>
							<ListItemText
								id={key}
								primary={key}
								secondary={"********"}
							/>
							{(secret.managedby !== "app" ||
								secret.namespace === appName) && (
								<ListItemSecondaryAction>
									<Button
										onClick={() =>
											handleClickOpen(key, "", true)
										}
									>
										{`Set${
											secret.managedby === "app"
												? " for App"
												: ""
										}`}
									</Button>
								</ListItemSecondaryAction>
							)}
						</ListItem>
					)
				})}
			</List>
			<Dialog
				fullWidth
				open={state.selected !== ""}
				onClose={handleClose}
				aria-labelledby="alert-dialog-title"
				aria-describedby="alert-dialog-description"
			>
				<DialogTitle id="alert-dialog-title">
					{"Set " + (state.isSecret ? "Secret" : "Config Value")}
				</DialogTitle>
				<DialogContent>
					<DialogContentText>{state.selected}</DialogContentText>
					<TextField
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
				</DialogContent>
				<DialogActions>
					<Button onClick={handleSet} color="primary">
						Set
					</Button>
				</DialogActions>
			</Dialog>
		</>
	)
}

export default ConfigSecrets
