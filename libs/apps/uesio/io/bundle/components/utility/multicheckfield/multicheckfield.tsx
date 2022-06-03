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

const CheckBoxField = component.getUtility("uesio/io.checkboxfield")
const Fieldset = component.getUtility("uesio/io.fieldset")

const MultiCheckField: FC<SelectFieldProps> = (props) => {
	const {
		setValue,
		value = {},
		mode,
		options,
		context,
		fieldMetadata,
	} = props

	const classes = styles.useUtilityStyles(
		{
			input: {
				appearance: "none",
			},
			option: {
				display: "flex",
				alignItems: "center",
			},
			label: {
				userSelect: "none",
			},
		},
		props
	)

	const fieldLabel = fieldMetadata.getLabel()

	return (
		<Fieldset
			context={context}
			fieldLabel={fieldLabel}
			disabled={mode === "READ"}
		>
			{options
				?.filter(({ value }) => value)
				.map((option) => {
					const optionId =
						`${fieldLabel}_check_${option.value}`.replace(/ /g, "_")
					return (
						<div className={classes.option} key={option.value}>
							<CheckBoxField
								id={optionId}
								value={value && value[option.value]}
								context={context}
								setValue={(optionVal: boolean) =>
									// Set the false/true value, then filter out the false values before setting
									setValue(
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
								}
							/>
							<label className={classes.label} htmlFor={optionId}>
								{option.label}
							</label>
						</div>
					)
				})}
		</Fieldset>
	)
}

export default MultiCheckField
