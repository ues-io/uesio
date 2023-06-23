import { FunctionComponent, useEffect, useRef } from "react"
import { definition, styles, context, wire } from "@uesio/ui"

interface CheckboxFieldProps extends definition.UtilityProps {
	setValue: (value: boolean) => void
	value: wire.FieldValue
	mode?: context.FieldMode
	focusOnRender?: boolean
}

const StyleDefaults = Object.freeze({
	root: ["leading-none"],
	input: [],
})

const CheckboxField: FunctionComponent<CheckboxFieldProps> = (props) => {
	const { focusOnRender = false, id, setValue, value, mode } = props
	const readonly = mode === "READ"

	const checked = value === true
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

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
				className={classes.input}
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
