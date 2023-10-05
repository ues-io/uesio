import { useEffect, useRef } from "react"
import { definition, styles, context, wire } from "@uesio/ui"

export type CheckboxFieldOptions = {
	checkedLabel?: string
	uncheckedLabel?: string
}

interface CheckboxFieldProps {
	setValue: (value: boolean) => void
	value: wire.FieldValue
	mode?: context.FieldMode
	focusOnRender?: boolean
}

const StyleDefaults = Object.freeze({
	root: [],
	checkbox: [],
})

const CheckboxField: definition.UtilityComponent<CheckboxFieldProps> = (
	props
) => {
	const { focusOnRender = false, id, setValue, value, mode } = props
	const readonly = mode === "READ"

	const checked = value === true
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.checkboxfield"
	)

	const checkRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (!checkRef.current) return
		checkRef.current.indeterminate = value === undefined || value === null
	}, [value])

	return (
		<div className={classes.root}>
			<input
				ref={checkRef}
				id={id}
				className={classes.checkbox}
				checked={checked}
				type="checkbox"
				disabled={readonly}
				onChange={(event) => setValue?.(event.target.checked)}
				autoFocus={focusOnRender}
			/>
		</div>
	)
}

export default CheckboxField
