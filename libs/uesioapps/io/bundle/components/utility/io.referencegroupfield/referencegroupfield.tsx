import { FunctionComponent } from "react"
import {
	wire,
	hooks,
	collection,
	definition,
	component,
	context,
} from "@uesio/ui"
import { ReferenceGroupFieldOptions } from "../../view/io.field/fielddefinition"

const TextField = component.registry.getUtility("io.textfield")

interface ReferenceGroupFieldProps extends definition.UtilityProps {
	fieldMetadata: collection.Field
	mode: context.FieldMode
	record: wire.WireRecord
	wire: wire.Wire
	variant: string
	options?: ReferenceGroupFieldOptions
}

const ReferenceGroupField: FunctionComponent<ReferenceGroupFieldProps> = (
	props
) => {
	const uesio = hooks.useUesio(props)
	const { fieldMetadata, mode, record, context, variant, options, path } =
		props
	const fieldId = fieldMetadata.getId()
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
			return itemContext.merge(template)
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

	const value = record.getFieldValue<wire.PlainWireRecord[] | undefined>(
		fieldId
	)

	if (components) {
		return (
			<>
				{value?.map((item, index) => {
					return (
						<component.Slot
							definition={options}
							listName="components"
							path={`${path}["referencegroup"]["${index}"]`}
							accepts={["uesio.context"]}
							context={context.addFrame({
								recordData: item,
							})}
						/>
					)
				})}
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
