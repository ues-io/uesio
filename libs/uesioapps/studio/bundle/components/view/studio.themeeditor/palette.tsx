import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface Props extends definition.BaseProps {
	label: string
	color: string
	setState: (label: string, color: string) => void
}

const Palette: FunctionComponent<Props> = (props) => {
	const { label, color, setState } = props

	const classes = styles.useUtilityStyles(
		{
			container: {
				display: "inline-block",
				margin: "5px",
			},
			input: {
				MozAppearance: "none",
				WebkitAppearance: "none",
				appearance: "none",
				padding: "0",
				border: "none",
			},
			label: { textTransform: "capitalize" },
			divinput: {
				padding: "10px 15px",
				borderRadius: "5px",
				border: "1px solid #ccc",
				backgroundColor: "#f8f9f9",
			},
		},
		null
	)

	return (
		<div className={classes.container}>
			<label className={classes.label}>{label}</label>
			<div className={classes.divinput}>
				<input
					id="colorPicker"
					className={classes.input}
					type="color"
					value={color}
					onChange={(event: ChangeEvent<HTMLInputElement>): void =>
						setState(label, event.target.value)
					}
				/>
			</div>
		</div>
	)
}

export default Palette
