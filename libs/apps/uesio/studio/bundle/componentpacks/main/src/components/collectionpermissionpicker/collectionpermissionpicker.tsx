import { FunctionComponent } from "react"
import { definition, api, component, wire } from "@uesio/ui"

type CollectionPermissionDefinition = {
	fieldId: string
	wireName: string
}

interface Props extends definition.BaseProps {
	definition: CollectionPermissionDefinition
}

const CollectionPermissionPicker: FunctionComponent<Props> = (props) => {
	const TitleBar = component.getUtility("uesio/io.titlebar")
	//const MapField = component.getUtility("uesio/io.mapfield")
	const CheckboxField = component.getUtility("uesio/io.checkboxfield")
	const Table = component.getUtility("uesio/io.table")
	const {
		context,
		definition: { fieldId, wireName },
	} = props

	const record = context.getRecord()

	const wire = api.wire.useWire(wireName || "", context)

	const workspaceContext = context.getWorkspace()
	if (!workspaceContext) throw new Error("No workspace context provided")

	if (!wire || !record) {
		return null
	}

	const collection = wire.getCollection()
	const nameField = collection.getNameField()
	const nameNameField = nameField?.getId()
	if (!nameNameField) return null

	const mode = context.getFieldMode() || "READ"
	const value = record.getFieldValue<wire.PlainWireRecord>(fieldId) || {}
	const data = wire.getData()
	const disabled = mode === "READ"

	if (!value) return null

	const handleToggle = (listRecord: string, column: string) => {
		//const hasProperty = getValue(listRecord, column)

		console.log({ listRecord, column })
		console.log({ value })

		//record.update(fieldId, value, context)

		// if (!hasProperty) {
		// 	const updValue = { ...value, [listRecord]: true }
		// 	record.update(fieldId, updValue, context)
		// } else {
		const currentValue = value[listRecord] as wire.PlainWireRecord
		const test = currentValue[column]
		const updValue = { ...value, [listRecord]: !test }

		console.log({ currentValue, updValue, test })
		record.update(fieldId, updValue, context)
		//}
	}

	const getValue = (itemName: string, column: string) => {
		const item = value[itemName] as wire.PlainWireRecord
		return item && item[column]
	}

	const keys = ["Collection", "read", "create", "edit", "delete"]
	const columnHeaderFunc = (column: string) => column
	const cellFunc = (
		column: string,
		row: wire.WireRecord,
		columnIndex: number
	) => {
		//console.log({ column, row, columnIndex, value })
		const itemName =
			workspaceContext.app + "." + row.getFieldValue(nameNameField)
		return columnIndex === 0 ? (
			<TitleBar
				key={`${itemName}.${columnIndex}`}
				context={context}
				title={itemName}
			/>
		) : (
			<CheckboxField
				context={context}
				disabled={disabled}
				setValue={() => handleToggle(itemName, column)}
				value={getValue(itemName, column)}
				//mode={mode}
			/>
		)
	}

	return (
		<Table
			//mode={mode}
			context={context}
			rows={data}
			columns={keys}
			columnHeaderFunc={columnHeaderFunc}
			cellFunc={cellFunc}
		/>
	)

	// return (
	// 	<>
	// 		{data.map((record, i) => {
	// 			const itemName =
	// 				workspaceContext.app +
	// 				"." +
	// 				record.getFieldValue(nameNameField)
	// 			return (
	// 				<>
	// 					<TitleBar
	// 						key={`${itemName}.${i}`}
	// 						context={context}
	// 						title={itemName}
	// 					/>
	// 					<MapField
	// 						mode={mode}
	// 						value={getValue(itemName)}
	// 						noAdd
	// 						noDelete
	// 						setValue={(value: wire.FieldValue) =>
	// 							handleToggle(itemName, value)
	// 						}
	// 						context={context}
	// 						keys={keys}
	// 						keyField={{
	// 							name: "key",
	// 							label: "Access",
	// 						}}
	// 						valueField={{
	// 							name: "value",
	// 							label: "Value",
	// 							type: "CHECKBOX",
	// 						}}
	// 					/>
	// 				</>
	// 			)
	// 		})}
	// 	</>
	// )
}

export default CollectionPermissionPicker
