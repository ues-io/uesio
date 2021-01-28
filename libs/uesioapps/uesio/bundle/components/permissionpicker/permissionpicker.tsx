import React, { FunctionComponent, useEffect } from "react"
import { definition, material, hooks } from "@uesio/ui"

type PermissionPickerDefinition = {
	fieldId: string
	wireName: string
	label: string
}

interface Props extends definition.BaseProps {
	definition: PermissionPickerDefinition
}

const PermissionPicker: FunctionComponent<Props> = (props) => {
	const {
		context,
		definition: { fieldId, label, wireName },
	} = props

	const uesio = hooks.useUesio(props)
	const record = context.getRecord()
	const view = context.getView()
	const workspaceName = view?.params?.workspacename
	const appName = view?.params?.appname
	const wire = uesio.wire.useWire(wireName || "")

	if (!wire || !record || !workspaceName || !appName) {
		return null
	}

	uesio.addContextFrame({
		workspace: {
			name: workspaceName,
			app: appName,
		},
	})

	const collection = wire.getCollection()
	const nameField = collection.getNameField()
	const nameNameField = nameField?.getId()
	if (!nameNameField) return null

	const mode = context.getFieldMode() || "READ"
	const [checked, setChecked] = React.useState(new Map())

	console.log("checked", checked)

	useEffect(() => {
		if (!checked) {
			const value = record.getFieldValue(fieldId) as Map<string, boolean>
			setChecked(value)
		}
	})

	let disabled = false
	if (mode === "READ") {
		disabled = true
	}

	console.log(fieldId, label, collection, mode)
	const data = wire.getData()

	const handleToggle = (listRecord: string) => () => {
		//TO-DO check the state before set true or false

		setChecked(checked.set(listRecord, true))
		record.update(fieldId, checked)
	}

	return (
		<material.List
			subheader={<material.ListSubheader>{label}</material.ListSubheader>}
			dense
		>
			{data.map((record) => (
				//let recordName  = record.getFieldValue(nameNameField) as string

				<material.ListItem divider>
					<material.ListItemText
						id={record.getId()}
						primary={record.getFieldValue(nameNameField)}
					/>
					<material.ListItemSecondaryAction>
						<material.Switch
							edge="start"
							disabled={disabled}
							onChange={handleToggle(
								record.getFieldValue(nameNameField) as string
							)}
							checked={checked.get("crm.accounts")}
							inputProps={{
								"aria-labelledby": record.getId(),
							}}
						/>
					</material.ListItemSecondaryAction>
				</material.ListItem>
			))}
		</material.List>
	)
}

export default PermissionPicker
