import { CSSInterpolation } from "@emotion/css"
import { definition, component, styles } from "@uesio/ui"
import { ReactNode } from "react"

type Props = {
	config?: ReactNode
	code?: ReactNode
}

const StyleDefaults = {
	root: {
		gridTemplateColumns: "auto 1fr auto",
		gridTemplateRows: "100%",
		padding: "6px",
		rowGap: "6px",
	},
	column: {
		display: "grid",
		gridTemplateRows: "100%",
		position: "relative",
	},
} as Record<string, CSSInterpolation>

const BuildArea: definition.UtilityComponent<Props> = (props) => {
	const { context, children, code, config } = props
	const Grid = component.getUtility("uesio/io.grid")
	const classes = styles.useUtilityStyles(StyleDefaults, props)

	return (
		<Grid context={context} className={classes.root}>
			<div className={classes.column}>{config}</div>
			<div className={classes.column}>{children}</div>
			<div className={classes.column}>{code}</div>
		</Grid>
	)
}

export default BuildArea
