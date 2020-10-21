import * as React from "react"
import { material, wire, hooks } from "uesio"
import { RendererProps } from "./fielddefinition"
import { PlainCollection } from "uesio/src/collection/collection"
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
	referencedCollection: PlainCollection,
	record: wire.WireRecord
): string => {
	const nameFieldOfReferencedCollection = referencedCollection.nameField
	const referenceFieldValue = record.getFieldValue(
		fieldId
	) as wire.PlainWireRecord
	if (!referenceFieldValue) {
		return ""
	}
	const value = referenceFieldValue[nameFieldOfReferencedCollection]
	if (typeof value === "number" || typeof value === "boolean") {
		return value + ""
	}
	if (typeof value === "object") {
		return ""
	}
	if (!value) {
		return ""
	}
	return value
}

const Reference = (props: RendererProps): React.ReactElement | null => {
	const uesio = hooks.useUesio(props)
	const classes = useStyles(props)
	const fieldMetadata = props.fieldMetadata
	const hideLabel = props.hideLabel
	const mode = props.mode

	const referencedCollection = uesio.wire.useCollection(
		fieldMetadata.source.referencedCollection || ""
	)

	if (!referencedCollection) {
		return null
	}

	const value = generateReferenceFieldDisplayValue(
		props.fieldId,
		referencedCollection,
		props.record
	)

	const foreignFieldId = fieldMetadata.source.foreignKeyField
	if (mode === "READ") {
		return (
			<material.TextField
				{...{
					className: classes.root,
					...(!hideLabel && {
						label: fieldMetadata.getLabel(),
					}),
					fullWidth: true,
					InputLabelProps: {
						disableAnimation: true,
						shrink: true,
					},
					InputProps: {
						readOnly: true,
						disableUnderline: true,
					},
					value,
				}}
			/>
		)
	} else {
		return (
			<AutoCompleteField
				{...{
					...props,
					value,
					setValue: (value: string) => {
						if (!foreignFieldId) {
							return
						}
						props.record.update(foreignFieldId, value)
					},
					getItems: async (
						searchText: string,
						callback: (items: SelectedItem[]) => void
					) => {
						const refCol = referencedCollection
						const result = await uesio.platform.loadData(
							props.context,
							{
								wires: [
									{
										wire: "search",
										type: "QUERY",
										collection:
											refCol.namespace +
											"." +
											refCol.name,
										fields: [
											{
												id: refCol.idField,
											},
											{
												id: refCol.nameField,
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
							}
						)
						callback(
							result.wires[0].data.map((record) => ({
								value:
									record[referencedCollection.nameField] + "",
								id: record[referencedCollection.idField] + "",
							}))
						)
					},
				}}
			></AutoCompleteField>
		)
	}
}

Reference.displayName = "Reference"

export default Reference
