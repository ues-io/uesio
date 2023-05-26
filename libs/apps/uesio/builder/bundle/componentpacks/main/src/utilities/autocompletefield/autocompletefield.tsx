import { component, definition, wire } from "@uesio/ui"
import { useMemo } from "react"

interface AutocompleteFieldProps {
	applyChanges?: "onBlur" | "onChange"
	focusOnRender?: boolean
	options: wire.SelectOption[]
	placeholder?: string
	setValue?: (value: wire.PlainFieldValue) => void
	value?: wire.FieldValue
}

const AutocompleteField: definition.UtilityComponent<AutocompleteFieldProps> = (
	props
) => {
	const { id, options } = props
	const TextField = component.getUtility("uesio/io.textfield")
	const listId = `${id}-datalist`
	const dataList = useMemo(
		() => (
			<datalist id={listId}>
				{options.map((optionDef) => (
					<option key={optionDef.value} {...optionDef} />
				))}
			</datalist>
		),
		[listId, options]
	)
	return (
		<>
			{dataList}
			<TextField {...props} list={listId} />
		</>
	)
}

export default AutocompleteField
