import {
	wire,
	collection,
	definition,
	context,
	component,
	api,
} from "@uesio/ui"
import ReferenceField from "./reference"
import { useState } from "react"
const { COLLECTION_FIELD } = collection

export type ReferenceFieldOptions = {
	searchFields?: string[]
	returnFields?: string[]
	order?: wire.OrderState[]
	components?: definition.DefinitionList
	template?: string
	requirewriteaccess?: boolean
	conditions?: wire.WireConditionState[]
}

interface MultiReferenceFieldProps {
	path: string
	fieldId: string
	fieldMetadata: collection.Field
	mode: context.FieldMode
	readonly?: boolean
	record?: wire.WireRecord
	options?: ReferenceFieldOptions
	placeholder?: string
	setValue?: (value: wire.PlainWireRecord | null) => void
}

const MultiReferenceField: definition.UtilityComponent<
	MultiReferenceFieldProps
> = (props) => {
	const SelectField = component.getUtility("uesio/io.selectfield")
	const Group = component.getUtility("uesio/io.group")
	const {
		path,
		fieldMetadata,
		mode,
		readonly,
		context,
		fieldId,
		record,
		setValue,
	} = props

	const recordCollection =
		(record?.getFieldValue(`${fieldId}->${COLLECTION_FIELD}`) as string) ||
		""

	const referenceMetadata = fieldMetadata.getReferenceMetadata()
	const hasCollections =
		referenceMetadata?.collections &&
		referenceMetadata.collections.length > 0

	const [metadata] = api.builder.useMetadataList(context, "COLLECTION", "")

	const collections = hasCollections
		? referenceMetadata?.collections
		: Object.keys(metadata || {})

	const [collectionId, setCollectionId] = useState<string>(recordCollection)

	if (!collections) return null
	const options = collections.map((x) => ({ label: x, value: x }))
	const isReadMode = readonly || mode === "READ"

	return (
		<Group context={context}>
			{!isReadMode && (
				<SelectField
					context={context}
					value={collectionId}
					options={collection.addBlankSelectOption(options)}
					setValue={(value: string) => {
						setCollectionId(value)
					}}
				/>
			)}
			{collectionId && (
				<ReferenceField
					path={path}
					fieldId={fieldId}
					record={record}
					fieldMetadata={
						new collection.Field({
							...fieldMetadata.source,
							reference: {
								collection: collectionId,
								multicollection: false,
								collections: [],
							},
						})
					}
					mode={mode}
					context={context}
					setValue={setValue}
				/>
			)}
		</Group>
	)
}

export default MultiReferenceField
