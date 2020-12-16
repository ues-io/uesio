import React, { FunctionComponent } from "react"
import { ProgressGaugeProps } from "./progressgaugedefinition"
import { material } from "@uesio/ui"

const useStyles = material.makeStyles(() =>
	material.createStyles({
		// add padding depending on indicator
		root: (props: ProgressGaugeProps) => ({
			padding: "20px",
			paddingTop: props.definition.indicator === "off" ? "20px" : "40px",
			backgroundColor: "White",
		}),
	})
)

const ProgressGauge: FunctionComponent<ProgressGaugeProps> = (props) => {
	const classes = useStyles(props)
	return (
		<div className={classes.root}>
			<material.Slider
				max={props.definition.total}
				value={props.definition.current}
				valueLabelDisplay={props.definition.indicator}
				aria-labelledby="discrete-slider-always"
			/>
		</div>
	)
}

export default ProgressGauge
