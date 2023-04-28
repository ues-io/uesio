import { definition, component, styles } from "@uesio/ui"
import { ReactNode } from "react"

type Props = {
	config?: ReactNode
	code?: ReactNode
	showCode?: boolean
}

const BuildArea: definition.UtilityComponent<Props> = (props) => {
	const { context, children, code, config, showCode } = props
	const Grid = component.getUtility("uesio/io.grid")
	const classes = styles.useUtilityStyleTokens(
		{
			root: [
				"h-full",
				showCode ? "grid-cols-[auto_1fr_auto]" : "grid-cols-[auto_1fr]",
				"grid-rows-[100%]",
			],
			column: ["grid", "grid-rows-[100%]", "relative"],
		},
		props
	)

	return (
		<Grid context={context} className={classes.root}>
			<div className={classes.column}>{config}</div>
			<div className={classes.column}>{children}</div>
			{showCode && <div className={classes.column}>{code}</div>}
		</Grid>
	)
}

export default BuildArea
