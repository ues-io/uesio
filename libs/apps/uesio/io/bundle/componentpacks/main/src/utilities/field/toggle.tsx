import { definition, styles, context, wire } from "@uesio/ui"

interface ToggleFieldProps {
	setValue: (value: boolean) => void
	value: wire.FieldValue
	mode?: context.FieldMode
}

const ToggleField: definition.UtilityComponent<ToggleFieldProps> = (props) => {
	const { setValue, value, mode } = props

	const readonly = mode === "READ"
	const checked = value === true
	const classes = styles.useUtilityStyleTokens(
		{
			root: ["p-[7px]"],
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
			],
			native: ["opacity-0", "w-0", "h-0"],
		},
		props
	)

	return (
		<div className={classes.root}>
			<label className={classes.switch} title="toggle">
				<input
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
