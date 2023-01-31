import {
	wire,
	api,
	collection,
	definition,
	component,
	context,
} from "@uesio/ui"
import { ReferenceFieldOptions } from "../../components/field/field"
import Autocomplete from "../autocomplete/autocomplete"
import TextField from "./text"

interface ReferenceFieldProps {
	path: string
	fieldId: string
	fieldMetadata: collection.Field
	mode: context.FieldMode
	record: wire.WireRecord
	options?: ReferenceFieldOptions
	placeholder?: string
}

const ReferenceField: definition.UtilityComponent<ReferenceFieldProps> = (
	props
) => {
	const {
		id,
		fieldId,
		fieldMetadata,
		mode,
		record,
		context,
		variant,
		options,
		path,
		placeholder,
	} = props

	const referencedCollection = api.collection.useCollection(
		context,
		fieldMetadata.source.reference?.collection || ""
	)

	if (!referencedCollection) return null

	const nameField = referencedCollection.getNameField()?.getId()

	if (!nameField) return null

	const template = options?.template

	const itemToString = (item: wire.PlainWireRecord | undefined) => {
		if (!item) return ""

		if (template) {
			const itemContext = context.addRecordDataFrame({
				recordData: item,
			})
			return itemContext.mergeString(template) as string
		}
		return (item[nameField] ||
			item[collection.UNIQUE_KEY_FIELD] ||
			item[collection.ID_FIELD] ||
			"") as string
	}

	const value = record.getFieldValue<wire.PlainWireRecord>(fieldId)

	if (mode === "READ") {
		return (
			<TextField
				id={id}
				value={itemToString(value)}
				context={context}
				variant={variant}
				mode={mode}
			/>
		)
	} else {
		return (
			<Autocomplete
				id={id}
				context={context}
				variant={variant}
				value={value}
				setValue={(value: wire.PlainWireRecord) => {
					record.update(fieldId, value)
				}}
				itemToString={itemToString}
				itemRenderer={(item: wire.PlainWireRecord, index: number) => {
					if (options?.components) {
						return (
							<component.Slot
								definition={options}
								listName="components"
								path={`${path}["reference"]["${index}"]`}
								context={context.addRecordDataFrame({
									recordData: item,
								})}
							/>
						)
					}
					return <div>{itemToString(item)}</div>
				}}
				getItems={async (
					searchText: string,
					callback: (items: wire.PlainWireRecord[]) => void
				) => {
					const searchFields = options?.searchFields || [nameField]
					const returnFields = options?.returnFields || [nameField]
					const result = await api.platform.loadData(context, {
						wires: [
							{
								name: "search",
								batchnumber: 0,
								batchid: "",
								view: context.getViewId() || "",
								query: true,
								collection: referencedCollection.getFullName(),
								fields: returnFields.map((fieldName) => ({
									id: fieldName,
								})),
								conditions: [
									{
										type: "SEARCH",
										value: searchText,
										valueSource: "VALUE",
										active: true,
										fields: searchFields,
									},
								],
								requirewriteaccess: options?.requirewriteaccess,
							},
						],
					})
					callback(Object.values(result.wires[0].data) || [])
				}}
				placeholder={placeholder}
			/>
		)
	}
}

export default ReferenceField
