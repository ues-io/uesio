import { FunctionComponent } from "react"
import { definition, component, hooks, styles } from "@uesio/ui"
import { cancel, save, useHasChanges } from "../api/defapi"

const TopActions: FunctionComponent<definition.UtilityProps> = (props) => {
	const Button = component.getUtility("uesio/io.button")
	const Group = component.getUtility("uesio/io.group")
	const { context, id } = props

	const hasChanges = useHasChanges(context)

	const classes = styles.useUtilityStyles(
		{
			root: {
				position: "absolute",
				top: "2px",
				right: "26px",
				left: "26px",
			},
			right: {
				justifyContent: "right",
			},
		},
		props
	)

	hooks.useHotKeyCallback("meta+s", () => {
		save(context)
	})

	hooks.useHotKeyCallback("meta+shift+c", () => {
		cancel(context)
	})

	return (
		<div className={classes.root}>
			{hasChanges && (
				<Group
					className={classes.right}
					alignItems="right"
					context={context}
				>
					<Button
						context={context}
						label="Save Changes"
						id={`${id}:save-builder-changes`}
						disabled={!hasChanges}
						variant="uesio/builder.primarytoolbar"
						onClick={() => {
							save(context)
						}}
					/>
					<Button
						context={context}
						id={`${id}:cancel-builder-changes`}
						label="Cancel"
						disabled={!hasChanges}
						variant="uesio/builder.secondarytoolbar"
						onClick={() => {
							cancel(context)
						}}
					/>
				</Group>
			)}
		</div>
	)
}
TopActions.displayName = "TopActions"
export default TopActions
