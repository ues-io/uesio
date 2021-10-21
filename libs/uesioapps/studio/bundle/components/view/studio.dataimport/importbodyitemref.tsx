import { FunctionComponent, useEffect, useState } from "react"
import { definition, hooks, component, collection } from "@uesio/ui"

interface Props extends definition.BaseProps {
	mapping: definition.ImportMapping | undefined
	setMapping: (mapping: definition.ImportMapping) => void
	field: collection.Field
}

const SelectField = component.registry.getUtility("io.selectfield")
const addBlankSelectOption = collection.addBlankSelectOption

const ImportBodyItemRef: FunctionComponent<Props> = (props) => {
	const { context, mapping, setMapping, field } = props
	const uesio = hooks.useUesio(props)
	const refCollectionId = field.source.reference?.collection
	const collection = uesio.collection.useCollection(
		context,
		refCollectionId || ""
	)
	if (!collection || !mapping) return null
	const collectionFields = Object.keys(collection?.source.fields)
	const options = addBlankSelectOption(
		collectionFields.map((key) => ({
			value: key,
			label: key,
		}))
	)

	return (
		<SelectField
			context={context}
			value={mapping?.matchfield}
			label={"Reference Match Field"}
			options={options}
			setValue={(matchfield: string) => {
				setMapping({
					...mapping,
					matchfield,
				})
			}}
		/>
	)
}

export default ImportBodyItemRef
