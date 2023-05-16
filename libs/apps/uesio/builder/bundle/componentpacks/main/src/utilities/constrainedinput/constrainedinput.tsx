import { definition, component, metadata, wire, styles } from "@uesio/ui"
import { FunctionComponent, useEffect, useState } from "react"

interface ConstrainedInputProps extends definition.UtilityProps {
	setValue: (value: wire.FieldValue) => void
	value: wire.FieldValue
	label: string
	labelPosition?: string
	fieldWrapperVariant?: metadata.MetadataKey
	textVariant?: metadata.MetadataKey
}

const StyleDefaults = Object.freeze({
	root: ["grid", "grid-cols-[1fr_max-content]", "gap-1"],
	button: ["p-1"],
})

const ConstrainedInput: FunctionComponent<ConstrainedInputProps> = (props) => {
	const {
		context,
		fieldWrapperVariant,
		textVariant,
		labelPosition,
		value,
		setValue,
		label,
	} = props

	useEffect(() => {
		setKeyValue(value)
	}, [value])

	const [inEditMode, setEditMode] = useState<boolean>(false)
	const [keyValue, setKeyValue] = useState<wire.FieldValue>(value)

	const onClickButton = () => {
		// If we are currently in edit mode, NOW we want to apply our update
		if (inEditMode) {
			setEditMode(false)
			setValue(keyValue)
		} else {
			setEditMode(true)
		}
	}

	const IconButton = component.getUtility("uesio/io.iconbutton")
	const TextField = component.getUtility("uesio/io.textfield")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.field"
	)

	return (
		<FieldWrapper
			label={label}
			labelPosition={labelPosition}
			context={context}
			variant={fieldWrapperVariant}
		>
			<div className={classes.root}>
				<TextField
					mode={inEditMode ? "EDIT" : "READ"}
					value={keyValue}
					setValue={setKeyValue}
					context={context}
					focusOnRender={true}
					variant={
						textVariant || "uesio/io.field:uesio/builder.propfield"
					}
				/>
				<IconButton
					onClick={onClickButton}
					icon={inEditMode ? "save" : "edit"}
					context={context}
					label={
						inEditMode ? "Apply change" : "Click to change value"
					}
					tooltipPlacement={"bottom-start"}
					className={classes.button}
				/>
			</div>
		</FieldWrapper>
	)
}

ConstrainedInput.displayName = "ConstrainedInput"

export default ConstrainedInput
