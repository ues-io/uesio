import { FunctionComponent } from "react"
import {
	wire,
	hooks,
	collection,
	definition,
	context,
	component,
} from "@uesio/ui"

const KeyValueList = component.registry.getUtility("io.keyvaluelist")

type Option = {
	label: string
	value: string
}

interface Props extends definition.UtilityProps {
	label?: string
	fieldMetadata: collection.Field
	mode: context.FieldMode
	hideLabel: boolean
	record: wire.WireRecord
	wire: wire.Wire
	variant: string
}

const ListFieldField: FunctionComponent<Props> = (props) => {
	const uesio = hooks.useUesio(props)
	const { fieldMetadata, hideLabel, mode, record, context, variant } = props

	if (!fieldMetadata) return null

	const fieldId = fieldMetadata.getId()
	const value = record.getFieldArray(fieldId)
	const subfields = fieldMetadata.source.subfields

	if (!subfields || !value) return null

	const allowed = subfields.map((subfield) => subfield.name)
	const filtered = Array.from(value, (element, index) =>
		Object.fromEntries(
			Object.entries(element).filter(([key, val]) =>
				allowed.includes(key)
			)
		)
	)

	return (
		<table>
			<tr>
				{subfields.map((subfield) => (
					<th>{subfield.name}</th>
				))}
			</tr>
			{filtered.map((item: Option) => (
				<tr>
					<td>{item.label}</td>
					<td>{item.value}</td>
				</tr>
			))}
		</table>
	)
}

export default ListFieldField
