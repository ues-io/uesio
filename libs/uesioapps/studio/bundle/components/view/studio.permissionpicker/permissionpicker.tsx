import { FunctionComponent } from "react"
import { definition, hooks, wire } from "@uesio/ui"
import {
	ListItem,
	List,
	Switch,
	ListSubheader,
	ListItemText,
	ListItemSecondaryAction,
} from "@material-ui/core"

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

	const collection = wire.getCollection()
	const nameField = collection.getNameField()
	const nameNameField = nameField?.getId()
	if (!nameNameField) return null

	const mode = context.getFieldMode() || "READ"
	const value = (record.getFieldValue(fieldId) as wire.PlainWireRecord) || {}

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
		<List subheader={<ListSubheader>{label}</ListSubheader>} dense>
			{data.map((record) => {
				const itemName =
					appName + "." + record.getFieldValue(nameNameField)
				return (
					<ListItem divider>
						<ListItemText id={record.getId()} primary={itemName} />
						<ListItemSecondaryAction>
							<Switch
								edge="start"
								disabled={disabled}
								onChange={handleToggle(itemName)}
								checked={(value[itemName] as boolean) || false}
								inputProps={{
									"aria-labelledby": record.getId(),
								}}
							/>
						</ListItemSecondaryAction>
					</ListItem>
				)
			})}
		</List>
	)
}

export default PermissionPicker
