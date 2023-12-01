import { definition, styles } from "@uesio/ui"
import { useDragPath, useDropPath, useSelectedPath } from "../../api/stateapi"
import { getPathDots } from "./propertiespanel/propertieswrapper"

const DebugPanel: definition.UtilityComponent = (props) => {
	const context = props.context

	const classes = styles.useUtilityStyleTokens(
		{
			root: ["absolute", "bottom-0", "left-0", "p-2"],
			item: ["text-[6pt]"],
			selectedcrumb: ["bg-blue-400"],
			dragcrumb: ["bg-green-400"],
			dropcrumb: ["bg-purple-400"],
			crumb: [
				"h-[3px]",
				"w-[3px]",
				"inline-block",
				"mr-[3px]",
				"rounded-full",
			],
			crumbwrapper: [],
		},
		props
	)

	const dragPath = useDragPath(context)
	const dropPath = useDropPath(context)
	const selectedPath = useSelectedPath(context)

	return (
		<div className={classes.root}>
			{dragPath.isSet() && (
				<div className={classes.item}>
					{getPathDots(
						dragPath,
						styles.cx(classes.dragcrumb, classes.crumb),
						classes.crumbwrapper
					)}
				</div>
			)}
			{dropPath.isSet() && (
				<div className={classes.item}>
					{getPathDots(
						dropPath,
						styles.cx(classes.dropcrumb, classes.crumb),
						classes.crumbwrapper
					)}
				</div>
			)}
			{selectedPath.isSet() && (
				<div className={classes.item}>
					{getPathDots(
						selectedPath,
						styles.cx(classes.selectedcrumb, classes.crumb),
						classes.crumbwrapper
					)}
				</div>
			)}
		</div>
	)
}
DebugPanel.displayName = "DebugPanel"

export default DebugPanel
