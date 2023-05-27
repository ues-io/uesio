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
	const ComboboxField = component.getUtility("uesio/builder.comboboxfield")

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

	const search = (text: string) => {
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
		<ComboboxField
			context={context}
			applyChanges="onBlur"
			focusOnRender
			setValue={setValue}
			value={value}
			onSearch={search}
			textVariant="uesio/io.field:uesio/builder.propfield"
			iconButtonVariant="uesio/io.iconbutton:uesio/io.primary"
			menuVariant="uesio/io.menu:uesio/io.default"
		/>
	)
}

export default TailwindClassPicker
