import { component, definition, wire } from "@uesio/ui"
import { useMemo } from "react"
import fuzzysort from "fuzzysort"
// import type Prepared from "fuzzysort"

type Props = {
	setValue?: (value: wire.PlainFieldValue) => void
	value?: wire.FieldValue
	parsedTokens: string[][]
}

type SortResult = {
	className: string
	css: string
}

const TailwindClassPicker: definition.UtilityComponent<Props> = (props) => {
	const { context, setValue, value, parsedTokens } = props
	const AutocompleteField = component.getUtility(
		"uesio/builder.autocompletefield"
	)

	const tailwindClasses = useMemo(
		() =>
			parsedTokens.map(([className, cssClasses]) => ({
				className,
				classNamePrepared: fuzzysort.prepare(className),
				css: cssClasses,
				cssPrepared: fuzzysort.prepare(cssClasses),
			})),
		[parsedTokens]
	)
	const itemRenderer = (item: wire.SelectOption) =>
		`${item.value} (${item.label})`
	const getItemKey = (item: wire.SelectOption) => item.value

	const search = async (text: string) => {
		if (text?.trim() === "") return []
		return fuzzysort
			.go<SortResult>(text, tailwindClasses, {
				keys: ["classNamePrepared", "cssPrepared"],
				// allowTypo: false,
				// threshold: -10000,
			})
			.map(
				(r) =>
					({
						value: r.obj.className,
						label: r.obj.css,
					} as wire.SelectOption)
			)
	}
	return (
		<AutocompleteField
			context={context}
			applyChanges="onBlur"
			focusOnRender
			setValue={setValue}
			value={value}
			onSearch={search}
			itemRenderer={itemRenderer}
			getItemKey={getItemKey}
			placeholder="padding, border, etc."
		/>
	)
}

export default TailwindClassPicker
