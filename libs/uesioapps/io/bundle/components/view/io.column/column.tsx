import { FC, useContext } from "react"
import { definition, component, styles } from "@uesio/ui"
import toPath from "lodash/toPath"
import { LayoutContext } from "../io.layout/layout"

export const getColumnFlexStyles = (
	template: string,
	path: string
): React.CSSProperties => {
	const columnIndex = parseInt(toPath(path).slice(-2)[0], 10)
	const templateArr = template.split(",")
	const flexRatio = templateArr[columnIndex]
	return {
		flex: flexRatio || "initial",
		gap: "inherit",
	}
}

const Column: FC<definition.BaseProps> = (props) => {
	const { definition, context, path = "" } = props

	const flexStyles = context.getBuildMode()
		? {}
		: getColumnFlexStyles(useContext(LayoutContext), path)

	const classes = styles.useStyles(
		{
			root: {
				...flexStyles,
			},
		},
		props
	)

	return (
		<div className={classes.root}>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				accepts={["uesio.standalone", "uesio.field", "io.field"]}
				context={context}
			/>
		</div>
	)
}

export default Column
