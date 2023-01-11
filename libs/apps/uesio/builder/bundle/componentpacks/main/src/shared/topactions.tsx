import { FunctionComponent } from "react"
import { definition, component, api, hooks, styles } from "@uesio/ui"

const TopActions: FunctionComponent<definition.UtilityProps> = (props) => {
	const Button = component.getUtility("uesio/io.button")
	const Group = component.getUtility("uesio/io.group")
	const { context } = props

	const hasChanges = api.builder.useHasChanges()

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
		api.builder.save(context)
	})

	hooks.useHotKeyCallback("meta+shift+c", () => {
		api.builder.cancel(context)
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
						disabled={!hasChanges}
						variant="uesio/builder.primarytoolbar"
						onClick={() => {
							api.builder.save(context)
						}}
					/>
					<Button
						context={context}
						label="Cancel"
						disabled={!hasChanges}
						variant="uesio/builder.secondarytoolbar"
						onClick={() => {
							api.builder.cancel(context)
						}}
					/>
				</Group>
			)}
		</div>
	)
}
TopActions.displayName = "TopActions"
export default TopActions
