import { FunctionComponent } from "react"
import {
	wire,
	hooks,
	collection,
	definition,
	component,
	context,
} from "@uesio/ui"
import { SelectedItem } from "../io.autocomplete/autocomplete"

const TextField = component.registry.getUtility("io.textfield")
const AutoComplete = component.registry.getUtility("io.autocomplete")

interface ReferenceFieldProps extends definition.UtilityProps {
	label?: string
	fieldMetadata: collection.Field
	mode: context.FieldMode
	hideLabel: boolean
	record: wire.WireRecord
	wire: wire.Wire
}

// TODO:: Modify this to accept an arbitary display template
const generateReferenceFieldDisplayValue = (
	fieldId: string,
	referencedCollection: collection.Collection,
	record: wire.WireRecord
): string => {
	const nameFieldOfReferencedCollection = referencedCollection
		.getNameField()
		?.getId()
	const referenceFieldValue = record.getFieldReference(fieldId)
	if (
		!referenceFieldValue ||
		typeof referenceFieldValue !== "object" ||
		!nameFieldOfReferencedCollection
	)
		return ""

	const value = referenceFieldValue[nameFieldOfReferencedCollection]
	if (typeof value === "number" || typeof value === "boolean")
		return `${value}`

	if (typeof value === "object") return ""

	if (!value) return ""

	return value
}

const ReferenceField: FunctionComponent<ReferenceFieldProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { fieldMetadata, hideLabel, mode, record, context } = props
	const fieldId = fieldMetadata.getId()

	const referencedCollection = uesio.collection.useCollection(
		fieldMetadata.source.referencedCollection || ""
	)

	if (!referencedCollection) {
		return null
	}

	const value = generateReferenceFieldDisplayValue(
		fieldId,
		referencedCollection,
		record
	)

	const foreignFieldId = fieldMetadata.source.foreignKeyField
	if (mode === "READ") {
		return (
			<TextField
				value={value}
				{...(!hideLabel && {
					label: fieldMetadata.getLabel(),
				})}
				context={context}
			/>
		)
	} else {
		return (
			<AutoComplete
				context={context}
				value={value}
				setValue={(value: string) => {
					foreignFieldId && record.update(foreignFieldId, value)
				}}
				getItems={async (
					searchText: string,
					callback: (items: SelectedItem[]) => void
				) => {
					const idField = referencedCollection.getIdField()?.getId()
					const nameField = referencedCollection
						.getNameField()
						?.getId()
					if (!idField || !nameField) return
					const result = await uesio.platform.loadData(context, {
						wires: [
							{
								wire: "search",
								type: "QUERY",
								collection: referencedCollection.getFullName(),
								fields: [
									{
										id: idField,
									},
									{
										id: nameField,
									},
								],
								conditions: [
									{
										type: "SEARCH",
										value: searchText,
										valueSource: "VALUE",
										active: true,
									},
								],
							},
						],
					})
					callback(
						result.wires[0].data?.map((record) => ({
							value: `${record[nameField]}`,
							id: `${record[idField]}`,
						})) || []
					)
				}}
			/>
		)
	}
}

export default ReferenceField
