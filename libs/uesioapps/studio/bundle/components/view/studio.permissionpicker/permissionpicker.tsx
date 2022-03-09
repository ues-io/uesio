import { FC } from "react"
import { definition, hooks, component, wire } from "@uesio/ui"
import FieldsPermissionPicker from "./fieldspermissionpicker"
type PermissionPickerDefinition = {
	fieldId: string
	wireName: string
	fieldsWireName: string
}

interface Props extends definition.BaseProps {
	definition: PermissionPickerDefinition
}

const CheckboxField = component.registry.getUtility("io.checkboxfield")
const TitleBar = component.registry.getUtility("io.titlebar")

const PermissionPicker: FC<Props> = (props) => {
	const {
		context,
		definition: { fieldsWireName, fieldId, wireName },
	} = props

	const uesio = hooks.useUesio(props)
	const record = context.getRecord()
	const { workspacename: workspaceName, appname: appName } =
		context.getView()?.params || {}
	const wire = uesio.wire.useWire(wireName || "")
	if (!wire || !record || !workspaceName || !appName) return null

	const nameNameField = wire.getCollection().getNameField()?.getId()
	if (!nameNameField) return null

	const mode = context.getFieldMode() || "READ"
	const disabled = mode === "READ"
	const value =
		record.getFieldValue<wire.PlainWireRecord | undefined>(fieldId) || {}
	const data = wire.getData()

	if (!value) return null

	const handleToggle = (listRecord: string) =>
		record.update(fieldId, {
			...value,
			[listRecord]: getValue(listRecord) ? !value[listRecord] : true,
		})

	const getValue = (itemName: string) => (value[itemName] as boolean) || false

	return (
		<>
			{data.map((record, i) => {
				const itemName =
					appName + "." + record.getFieldValue(nameNameField)
				const hasAccess = !!getValue(itemName)

				return (
					<>
						<TitleBar
							key={`${itemName}.${i}`}
							context={context}
							title={itemName}
							onClick={() => handleToggle(itemName)}
							actions={
								<CheckboxField
									context={context}
									disabled={disabled}
									setValue={() => handleToggle(itemName)}
									value={hasAccess}
									mode={mode}
								/>
							}
						/>
						{fieldsWireName && hasAccess && (
							<div
								style={{
									marginBottom: "1em",
									paddingBottom: "1em",
									borderBottom: "1px solid #eee",
									paddingLeft: "1em",
								}}
							>
								<FieldsPermissionPicker
									context={context}
									collectionName={itemName}
									wireName={fieldsWireName}
								/>
							</div>
						)}
					</>
				)
			})}
		</>
	)
}

export default PermissionPicker
