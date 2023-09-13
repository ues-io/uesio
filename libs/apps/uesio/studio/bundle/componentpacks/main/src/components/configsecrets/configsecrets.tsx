import { FunctionComponent, useState } from "react"
import { definition, api, component, metadata } from "@uesio/ui"
import { FloatingPortal } from "@floating-ui/react"

const ConfigSecrets: FunctionComponent<definition.BaseProps> = (props) => {
	const TitleBar = component.getUtility("uesio/io.titlebar")
	const Button = component.getUtility("uesio/io.button")
	const Dialog = component.getUtility("uesio/io.dialog")
	const TextField = component.getUtility("uesio/io.textfield")
	const { context } = props

	const valueType = props.definition?.valueType
	const isSecret = valueType !== "config"

	const [values, resetValues] = isSecret
		? api.secret.useSecrets(context)
		: api.configvalue.useConfigValues(context)

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
		const apifunc = isSecret ? api.secret : api.configvalue
		await apifunc.set(context, state.selected, state.value)
		resetValues()
		handleClose()
	}

	return (
		<>
			{values?.map((response) => {
				const key = metadata.getKey(response)
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
								label="Set"
							/>
						}
					/>
				)
			})}
			{state.selected !== "" && (
				<FloatingPortal>
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
				</FloatingPortal>
			)}
		</>
	)
}

export default ConfigSecrets
