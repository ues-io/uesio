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
			swatch: {
				background: "white",
				boxShadow: "5px 5px 5px rgba(0, 0, 0, .1)",
				display: "flex",
				flexDirection: "column",
				borderRadius: "5px",
			},
			input: {
				MozAppearance: "none",
				WebkitAppearance: "none",
				appearance: "none",
				background: "none",
				border: 0,
				cursor: "pointer",
				height: "10em",
				padding: 0,
				width: "10em",
			},
			label: { textTransform: "capitalize", margin: 0 },
			info: {
				padding: "1em",
			},
		},
		null
	)

	return (
		<div className={classes.swatch}>
			<input
				id="colorPicker"
				className={classes.input}
				type="color"
				value={color}
				onChange={(event: ChangeEvent<HTMLInputElement>): void =>
					setState(label, event.target.value)
				}
			/>
			<div className={classes.info}>
				<p className={classes.label}>{label}</p>
				<p>{color}</p>
			</div>
		</div>
	)
}

export default Palette
