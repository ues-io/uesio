import { FunctionComponent } from "react"
import {
	wire,
	hooks,
	collection,
	definition,
	component,
	context,
	metadata,
} from "@uesio/ui"
import { ReferenceFieldOptions } from "../../view/field/fielddefinition"

const TextField = component.getUtility("uesio/io.textfield")
const AutoComplete = component.getUtility("uesio/io.autocomplete")

interface ReferenceFieldProps extends definition.UtilityProps {
	fieldId: string
	fieldMetadata: collection.Field
	mode: context.FieldMode
	record: wire.WireRecord
	wire: wire.Wire
	variant: metadata.MetadataKey
	options?: ReferenceFieldOptions
	placeholder?: string
}

const ReferenceField: FunctionComponent<ReferenceFieldProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const {
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

	const referencedCollection = uesio.collection.useCollection(
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
			const itemContext = context.addFrame({
				recordData: item,
			})
			return itemContext.merge(template)
		}
		return item[nameField] || ""
	}

	const value = record.getFieldValue<wire.PlainWireRecord>(fieldId)

	if (mode === "READ") {
		return (
			<TextField
				value={itemToString(value)}
				context={context}
				variant={variant}
				mode={mode}
			/>
		)
	} else {
		return (
			<AutoComplete
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
								accepts={["uesio.context"]}
								context={context.addFrame({
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
					const result = await uesio.platform.loadData(context, {
						wires: [
							{
								batchid: "0",
								batchnumber: 1,
								data: {},
								view: context.getViewId() || "",
								name: "search",
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
							},
						],
					})
					callback(result.wires || [])
				}}
				placeholder={placeholder}
			/>
		)
	}
}

export default ReferenceField
