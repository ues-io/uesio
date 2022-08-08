import { FunctionComponent } from "react"
import { definition, component, hooks, styles } from "@uesio/ui"

const Button = component.getUtility("uesio/io.button")
const Group = component.getUtility("uesio/io.group")

const TopActions: FunctionComponent<definition.UtilityProps> = (props) => {
	const { context } = props
	const uesio = hooks.useUesio(props)
	const hasChanges = uesio.builder.useHasChanges()

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

	hooks.useHotKeyCallback("command+s", () => {
		uesio.builder.save()
	})

	hooks.useHotKeyCallback("command+shift+c", () => {
		uesio.builder.cancel()
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
						variant="uesio/studio.primarytoolbar"
						onClick={() => {
							uesio.builder.save()
						}}
					/>
					<Button
						context={context}
						label="Cancel"
						disabled={!hasChanges}
						variant="uesio/studio.secondarytoolbar"
						onClick={() => {
							uesio.builder.cancel()
						}}
					/>
				</Group>
			)}
		</div>
	)
}
TopActions.displayName = "TopActions"
export default TopActions
