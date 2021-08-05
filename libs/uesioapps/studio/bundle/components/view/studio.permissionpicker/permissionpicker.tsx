import { FunctionComponent } from "react"
import { definition, hooks, component } from "@uesio/ui"
import { values } from "lodash"

type PermissionPickerDefinition = {
	fieldId: string
	wireName: string
	dataType?: "array"
}

interface Props extends definition.BaseProps {
	definition: PermissionPickerDefinition
}

const CheckboxField = component.registry.getUtility("io.checkboxfield")
const TitleBar = component.registry.getUtility("io.titlebar")

const PermissionPicker: FunctionComponent<Props> = (props) => {
	const {
		context,
		definition: { fieldId, wireName, dataType },
	} = props

	const isArray = dataType === "array"
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
	const value = !isArray
		? record.getFieldReference(fieldId) || {}
		: ((record.getFieldValue(fieldId) || []) as any)
	const disabled = mode === "READ"
	const data = wire.getData()

	if (!value) return null

	const addPublicHack = (arr: string[]) =>
		arr
			.filter((thing: string, i: number) => thing !== "uesio.public")
			.concat("uesio.public")

	const handleToggle = (listRecord: string) => {
		const hasProperty = getValue(listRecord)
		if (!hasProperty) {
			if (isArray) {
				const updValue = addPublicHack(value.concat(listRecord))
				record.update(fieldId, updValue)
				return
			}
			const updValue = { ...value, [listRecord]: true }
			record.update(fieldId, updValue)
		} else {
			if (isArray) {
				// HACK
				const updValue = addPublicHack(
					value.filter(
						(thing: any, i: number) =>
							i !== value.indexOf(listRecord)
					)
				)
				record.update(fieldId, updValue)
				return
			}
			const currentValue = value[listRecord]
			const updValue = { ...value, [listRecord]: !currentValue }
			record.update(fieldId, updValue)
		}
	}

	const getValue = (itemName: string) => {
		// Stuff
		if (dataType === "array") {
			if (!value) return false
			return (value.includes(itemName) as boolean) || false
		}
		return (value[itemName] as boolean) || false
	}

	return (
		<>
			{data.map((record) => {
				const itemName =
					appName + "." + record.getFieldValue(nameNameField)
				return (
					<TitleBar
						context={context}
						title={itemName}
						actions={
							<CheckboxField
								context={context}
								disabled={disabled}
								setValue={() => handleToggle(itemName)}
								value={getValue(itemName)}
								mode={mode}
							/>
						}
					/>
				)
			})}
		</>
	)
}

export default PermissionPicker
