import { FunctionComponent } from "react";
import { material, wire, hooks, collection } from "@uesio/ui"
import { RendererProps } from "./fielddefinition"
import AutoCompleteField, {
	SelectedItem,
} from "../autocompletefield/autocompletefield"

const useStyles = material.makeStyles((theme) => ({
	root: {
		margin: theme.spacing(1),
	},
}))
// TODO:: Modify this to accept an arbitary display template
const generateReferenceFieldDisplayValue = (
	fieldId: string,
	referencedCollection: collection.Collection,
	record: wire.WireRecord
): string => {
	const nameFieldOfReferencedCollection = referencedCollection
		.getNameField()
		?.getId()
	const referenceFieldValue = record.getFieldValue(fieldId)
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

const Reference: FunctionComponent<RendererProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const classes = useStyles(props)
	const { fieldMetadata, hideLabel, mode, fieldId, record, context } = props

	const referencedCollection = uesio.wire.useCollection(
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
			<material.TextField
				className={classes.root}
				fullWidth={true}
				InputLabelProps={{
					disableAnimation: true,
					shrink: true,
				}}
				InputProps={{
					readOnly: true,
					disableUnderline: true,
				}}
				value={value}
				{...(!hideLabel && {
					label: fieldMetadata.getLabel(),
				})}
			/>
		)
	} else {
		return (
			<AutoCompleteField
				{...props}
				value={value}
				setValue={(value: string) => {
					if (!foreignFieldId) {
						return
					}
					record.update(foreignFieldId, value)
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
						result.wires[0].data.map((record) => ({
							value: record[nameField] + "",
							id: record[idField] + "",
						}))
					)
				}}
			/>
		)
	}
}

Reference.displayName = "Reference"

export default Reference
