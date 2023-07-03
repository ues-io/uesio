import { FC, useEffect, useRef } from "react"
import { definition, styles, context, wire } from "@uesio/ui"

interface ToggleFieldProps extends definition.UtilityProps {
	setValue: (value: boolean) => void
	value: wire.FieldValue
	mode?: context.FieldMode
}

const ToggleField: FC<ToggleFieldProps> = (props) => {
	const { setValue, value, mode } = props
	const checkRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (!checkRef.current) return
		checkRef.current.indeterminate = value === undefined || value === null
	}, [value])
	const readonly = mode === "READ"
	const checked = value === true
	const isNull = value === null
	const classes = styles.useUtilityStyleTokens(
		{
			root: ["text-center"],
			switch: [
				"[&:has(:focus-visible)]:(outline(& 2 offset-2 blue-600))",
				"relative",
				"inline-block",
				"w-[2.5em]",
				"h-[1.5em]",
				"bg-slate-200",
				"transition-colors",
				"duration-100",
				checked && "bg-slate-800",
				"rounded-full",
				mode === "READ" ? "cursor-not-allowed" : "cursor-pointer",
			],

			slider: [
				"absolute",
				"h-[1em]",
				"w-[1em]",
				"left-1",
				"bottom-1",
				"bg-white",
				"transition-transform",
				"duration-300",
				"rounded-full",
				checked && "translate-x-4",
				isNull && "translate-x-2",
				isNull && "bg-slate-400",
			],
			native: ["opacity-0", "w-0", "h-0", isNull && "line-through"],
		},
		props
	)

	return (
		<div className={classes.root}>
			<label className={classes.switch} title="toggle">
				<input
					ref={checkRef}
					className={classes.native}
					checked={checked}
					type="checkbox"
					disabled={readonly}
					onChange={(event): void => setValue(event.target.checked)}
				/>
				<span className={classes.slider} />
			</label>
		</div>
	)
}

export default ToggleField
