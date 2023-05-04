import { FunctionComponent, useEffect, useRef } from "react"
import { definition, styles, context, wire } from "@uesio/ui"

interface CheckboxFieldProps extends definition.UtilityProps {
	setValue: (value: boolean) => void
	value: wire.FieldValue
	mode?: context.FieldMode
}

const CheckboxField: FunctionComponent<CheckboxFieldProps> = (props) => {
	const { id, setValue, value, mode } = props
	const readonly = mode === "READ"

	const checked = value === true
	const classes = styles.useUtilityStyleTokens(
		{
			root: ["leading-none"],
			input: [],
		},
		props
	)

	const checkRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (!checkRef.current) return
		checkRef.current.indeterminate = value === undefined
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
			/>
		</div>
	)
}

export default CheckboxField
