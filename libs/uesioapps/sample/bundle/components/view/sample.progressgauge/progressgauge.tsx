import { FunctionComponent } from "react"
import { ProgressGaugeProps } from "./progressgaugedefinition"
import { styles } from "@uesio/ui"

const ProgressGauge: FunctionComponent<ProgressGaugeProps> = (props) => {
	const classes = styles.useStyles(
		{
			// add padding depending on indicator
			root: {
				padding: "20px",
				paddingTop:
					props.definition.indicator === "off" ? "20px" : "40px",
				backgroundColor: "White",
			},
		},
		props
	)
	return (
		<div className={classes.root}>
			<input
				type="range"
				max={props.definition.total}
				value={props.definition.current}
			/>
		</div>
	)
}

export default ProgressGauge
