import React, { FunctionComponent } from "react"
import { definition, material, hooks, wire } from "@uesio/ui"

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

	const value = (record.getFieldValue(fieldId) as wire.PlainWireRecord) || {}

	console.log("value", value)

	let disabled = false
	if (mode === "READ") {
		disabled = true
	}

	const data = wire.getData()

	const handleToggle = (listRecord: string) => () => {
		const hasProperty = Object.prototype.hasOwnProperty.call(
			value,
			listRecord
		)
		if (!hasProperty) {
			const updValue = { ...value, [listRecord]: true }
			record.update(fieldId, updValue)
		} else {
			const currentValue = value[listRecord]
			const updValue = { ...value, [listRecord]: !currentValue }
			record.update(fieldId, updValue)
		}
	}

	return (
		<material.List
			subheader={<material.ListSubheader>{label}</material.ListSubheader>}
			dense
		>
			{data.map((record) => (
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
							checked={
								(value[
									record.getFieldValue(
										nameNameField
									) as string
								] as boolean) || false
							}
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
