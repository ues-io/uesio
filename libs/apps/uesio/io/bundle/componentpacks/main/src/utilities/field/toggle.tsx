import { FC } from "react"
import { definition, styles, context, collection, wire } from "@uesio/ui"

interface ToggleFieldProps extends definition.UtilityProps {
	setValue: (value: boolean) => void
	value: wire.FieldValue
	fieldMetadata: collection.Field
	mode?: context.FieldMode
}

const ToggleField: FC<ToggleFieldProps> = (props) => {
	const { setValue, value, mode } = props

	const {
		definition: {
			palette: { primary: primaryColor },
		},
	} = props.context.getTheme()

	const readonly = mode === "READ"
	const checked = value === true
	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "flex",
				justifyContent: "center",
				flexFlow: "column",
				userSelect: "none",
				".switch": {
					position: "relative",
					display: "inline-block",
					width: "2.5em",
					height: "1.5em",

					input: {
						opacity: "0",
						width: "0",
						height: "0",

						"&:checked + .slider": {
							backgroundColor: primaryColor,
						},
						"&:checked + .slider:before": {
							transform: "translateX(1em)",
						},
						"&::focus + .slider": {
							boxShadow: "0 0 1p " + primaryColor,
						},
					},
					".slider": {
						position: "absolute",
						backgroundColor: "#ccc",
						cursor: mode === "READ" ? "not-allowed" : "pointer",
						inset: "0 0 0 0",
						transition: ".4s",

						"&.round": {
							borderRadius: "34px",
						},
						"&.round:before": {
							borderRadius: "50%",
						},

						"&:before": {
							position: "absolute",
							content: '""',
							height: "1em",
							width: "1em",
							left: "4px",
							bottom: "4px",
							backgroundColor: "white",
							transition: ".4s",

							"@media (prefers-reduced-motion: reduce)": {
								transition: "none",
							},
						},
					},
				},
			},
			native: {},
			input: {},
			readonly: {},
		},
		props
	)

	return (
		<label title="toggle" className={classes.root}>
			<div className="switch">
				<input
					className={classes.native}
					checked={checked}
					type="checkbox"
					disabled={readonly}
					onChange={(event): void => setValue(event.target.checked)}
				/>
				<span className="slider round" />
			</div>
		</label>
	)
}

export default ToggleField
