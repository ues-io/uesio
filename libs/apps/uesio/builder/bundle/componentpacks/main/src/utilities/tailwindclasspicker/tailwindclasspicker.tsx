import { component, definition, wire } from "@uesio/ui"
import { useMemo, useState } from "react"
import fuzzysort from "fuzzysort"

type Props = {
	setValue?: (value: wire.PlainFieldValue) => void
	value?: wire.FieldValue
	parsedTokens: string[][]
}

const TailwindClassPicker: definition.UtilityComponent<Props> = (props) => {
	const { context, setValue, value, parsedTokens } = props
	const ComboboxField = component.getUtility("uesio/builder.comboboxfield")

	const tailwindClasses = useMemo(
		() =>
			parsedTokens.map(([className, cssClasses]) => ({
				classNamePrepared: fuzzysort.prepare(className),
				cssPrepared: fuzzysort.prepare(cssClasses),
			})),
		[parsedTokens]
	)
	const [items, setItems] = useState<wire.SelectOption[]>(
		[] as wire.SelectOption[]
	)

	const search = (text: string) => {
		const results = fuzzysort.go(text, tailwindClasses, {
			key: ["classNamePrepared", "cssPrepared"],
			allowTypo: false,
			threshold: -10000,
			// eslint-disable-next-line no-undef
		} as Fuzzysort.KeyOptions)
		setItems(
			results.map((r) => {
				console.log(r)
				return {
					value: r.obj.classNamePrepared.target,
					label: r.obj.cssPrepared.target,
				} as wire.SelectOption
			})
		)
	}
	return (
		<ComboboxField
			context={context}
			applyChanges="onBlur"
			focusOnRender
			setValue={setValue}
			value={value}
			items={items}
			onSearch={search}
			textVariant="uesio/io.field:uesio/builder.propfield"
		/>
	)
}

export default TailwindClassPicker
