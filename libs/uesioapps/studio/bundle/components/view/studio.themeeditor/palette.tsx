import { ChangeEvent, FunctionComponent } from "react"
import { component, definition, hooks, styles, util } from "@uesio/ui"

interface Props extends definition.BaseProps {
	label: string
	color: string
	setState: (label: string, color: string) => void
}

const Palette: FunctionComponent<Props> = (props) => {
	const { label, color, setState, context } = props

	const classes = styles.useUtilityStyles(
		{
			container: {
				display: "inline-block",
				margin: "5px",
			},
			label: { marginRight: "5px", textTransform: "capitalize" },
		},
		null
	)

	return (
		<div className={classes.container}>
			<div>
				<label className={classes.label}>{label}</label>
				<input
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
