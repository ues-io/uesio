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
import { ReferenceGroupFieldOptions } from "../../components/field/fielddefinition"

const TextField = component.getUtility("uesio/io.textfield")

interface ReferenceGroupFieldProps extends definition.UtilityProps {
	fieldMetadata: collection.Field
	fieldId: string
	mode: context.FieldMode
	record: wire.WireRecord
	wire: wire.Wire
	variant: metadata.MetadataKey
	options?: ReferenceGroupFieldOptions
}

const ReferenceGroupField: FunctionComponent<ReferenceGroupFieldProps> = (
	props
) => {
	const uesio = hooks.useUesio(props)
	const { fieldMetadata, fieldId, record, context, variant, options, path } =
		props

	const referencedCollection = uesio.collection.useCollection(
		context,
		fieldMetadata.source.referencegroup?.collection || ""
	)
	if (!referencedCollection) return null
	const nameField = referencedCollection.getNameField()?.getId()
	if (!nameField) return null
	const template = options?.template
	const components = options?.components

	const itemToString = (item: wire.PlainWireRecord) => {
		if (template) {
			const itemContext = context.addFrame({
				recordData: item,
			})
			return itemContext.mergeString(template)
		}
		return item[nameField] || ""
	}

	const itemsToString = (item: wire.PlainWireRecord[] | undefined) => {
		const items: wire.FieldValue[] = []
		if (!item) return ""
		for (const element of item) {
			items.push(itemToString(element))
		}
		return items
	}

	const value = record.getFieldValue<wire.PlainWireRecord[]>(fieldId)

	if (components) {
		return (
			<>
				{value?.map((item, index) => (
					<component.Slot
						key={index}
						definition={options}
						listName="components"
						path={`${path}["referencegroup"]["${index}"]`}
						accepts={["uesio.context"]}
						context={context.addFrame({
							recordData: item,
						})}
					/>
				))}
			</>
		)
	}

	return (
		<TextField
			value={itemsToString(value)}
			context={context}
			variant={variant}
			mode={"READ"}
		/>
	)
}

export default ReferenceGroupField
