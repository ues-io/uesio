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
	value?: Record<string, boolean>
	width?: string
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	options: collection.SelectOption[] | null
}

const CheckBoxField = component.registry.getUtility("io.checkboxfield")

const MultiCheckField: FC<SelectFieldProps> = (props) => {
	const { setValue, value = {}, mode, options, context } = props

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
				.map((option) => (
					<div className={classes.option} key={option.value}>
						<CheckBoxField
							id={"checkBoxId" + option.label}
							value={value[option.value]}
							context={context}
							setValue={(optionVal: boolean) => {
								if (mode === "READ") return
								// Set the false value, then filter out the false values before setting
								return setValue(
									Object.entries({
										...value,
										[option.value]: optionVal,
									}).reduce(
										(prev, [key, val]) =>
											val
												? { ...prev, [key]: true }
												: null,
										{}
									)
								)
							}}
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
