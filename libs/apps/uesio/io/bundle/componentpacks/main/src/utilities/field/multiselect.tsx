import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection, wire } from "@uesio/ui"
import { CSSInterpolation } from "@emotion/css"

interface SelectFieldProps extends definition.UtilityProps {
	setValue: (value: wire.PlainFieldValue[]) => void
	value: wire.PlainFieldValue[]
	width?: string
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	options: collection.SelectOption[] | null
}

const StyleDefaults = Object.freeze({
	input: {
		appearance: "none",
	},
} as Record<string, CSSInterpolation>)

const MultiSelectField: FunctionComponent<SelectFieldProps> = (props) => {
	const { setValue, value, mode, options } = props
	if (mode === "READ") {
		let displayLabel
		if (value !== undefined && value.length) {
			const valuesArray = value as wire.PlainFieldValue[]
			displayLabel = options
				?.filter((option) => valuesArray.includes(option.value))
				.map((option) => option?.label || option.value)
				.join(", ")
		}
		return <span>{displayLabel || ""}</span>
	}

	const classes = styles.useUtilityStyles(
		StyleDefaults,
		props,
	)

	return (
		<select
			multiple
			className={classes.input}
			onChange={(event: ChangeEvent<HTMLSelectElement>) => {
				setValue(
					Array.from(
						event.target.selectedOptions,
						(option) => option.value
					)
				)
			}}
			value={value as string[]}
		>
			{options?.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	)
}

export default MultiSelectField
