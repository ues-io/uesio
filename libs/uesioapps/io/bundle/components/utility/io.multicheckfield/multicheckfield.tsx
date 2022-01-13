import { FC } from "react"
import {
	definition,
	styles,
	context,
	collection,
	wire,
	component,
} from "@uesio/ui"

interface SelectFieldProps extends definition.UtilityProps {
	setValue: (value: wire.FieldValue) => void
	value: Record<string, boolean> | null
	width?: string
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	options: collection.SelectOption[] | null
}

const CheckBoxField = component.registry.getUtility("io.checkboxfield")

const MultiCheckField: FC<SelectFieldProps> = (props) => {
	const { setValue, value, mode, options, context } = props

	const classes = styles.useUtilityStyles(
		{
			input: {
				appearance: "none",
			},
			option: {
				display: "flex",
				alignItems: "center",
			},
		},
		props
	)

	return (
		<div>
			{options
				?.filter((el) => el.value)
				.map((option: { value: string; label: string }) => (
					<div className={classes.option} key={option.value}>
						<CheckBoxField
							id={"checkBoxId" + option.label}
							value={value && !!value[option.value]}
							context={context}
							setValue={(bool: boolean) =>
								mode === "EDIT" &&
								setValue({
									...value,
									[option.label]: bool,
								})
							}
						/>
						<label htmlFor={"checkBoxId" + option.label}>
							{option.label}
						</label>
					</div>
				))}
		</div>
	)
}

export default MultiCheckField
