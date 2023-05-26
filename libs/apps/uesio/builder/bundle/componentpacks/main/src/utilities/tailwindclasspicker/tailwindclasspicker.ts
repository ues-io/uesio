import { component, definition, wire } from "@uesio/ui"
import { useMemo } from "react"
import fuzzysort from "fuzzysort"

interface Props {
	applyChanges?: "onBlur" | "onChange"
	focusOnRender?: boolean
	placeholder?: string
	setValue?: (value: wire.PlainFieldValue) => void
	value?: wire.FieldValue
	parsedTokens: string[][]
}

const TailwindClassPicker: definition.UtilityComponent<Props> = (props) => {
	const { id, parsedTokens } = props
	const TextField = component.getUtility("uesio/io.textfield")

	const entries = useMemo(
		() =>
			parsedTokens.map(([classNamePrepared, cssPrepared]) => ({
				classNamePrepared,
				cssPrepared,
			})),
		[parsedTokens]
	)

	const search = (text: string) =>
		fuzzysort
			.go(text, entries, {
				keys: ["classNamePrepared", "cssPrepared"],
				allowTypo: false,
				threshold: -10000,
			})
			.map((r) => r.obj)

	return (
		<CustomSelect
			id={id}
			items={items}
			itemRenderer={renderer}
			variant={"uesio/io.customselectfield:uesio/io.default"}
			context={context}
			selectedItems={value ? [value] : []}
			isSelected={() => false}
			onSearch={onSearch}
			placeholder={placeholder}
			onSelect={(item: wire.PlainWireRecord) => {
				record.update(fieldId, item, context)
			}}
			onUnSelect={() => {
				record.update(fieldId, null, context)
			}}
			getItemKey={(item: wire.PlainWireRecord) =>
				item[collection.ID_FIELD] as string
			}
		/>
	)
}

export default TailwindClassPicker
