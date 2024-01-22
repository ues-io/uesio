import { definition, component, hooks, styles } from "@uesio/ui"
import { cancel, save, useHasChanges } from "../../api/defapi"
import { metaKey } from "./mainheader"
import { useBuildMode } from "../../api/stateapi"
import { toggleBuildMode } from "../../helpers/buildmode"

const StyleDefaults = Object.freeze({
	root: [
		"grid",
		"gap-3",
		"grid-flow-col",
		"auto-cols-min",
		"absolute",
		"top-2.5",
		"right-14",
		"px-1",
	],
})

const SaveCancelArea: definition.UtilityComponent = (props) => {
	const { context, id } = props
	const Button = component.getUtility("uesio/io.button")
	const Icon = component.getUtility("uesio/io.icon")

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	const hasChanges = useHasChanges(context)
	const [buildMode, setBuildMode] = useBuildMode(context)

	hooks.useHotKeyCallback("meta+s", () => {
		save(context)
	})

	hooks.useHotKeyCallback("meta+shift+c", () => {
		cancel(context)
	})

	return (
		<div className={classes.root}>
			{!hasChanges && (
				<Button
					context={context}
					icon={
						<Icon
							context={context}
							weight={300}
							fill={false}
							icon={"visibility"}
						/>
					}
					label="Preview"
					variant="uesio/builder.secondarytoolbar"
					onClick={() => {
						toggleBuildMode(context, setBuildMode, !!buildMode)
					}}
					tooltip={`Toggle Preview / Build mode (${metaKey} + U)`}
					tooltipPlacement="left"
				/>
			)}
			{hasChanges && (
				<Button
					context={context}
					icon={<Icon context={context} icon="check_circle" />}
					id={`${id}:save-builder-changes`}
					disabled={!hasChanges}
					variant="uesio/builder.primarytoolbar"
					label="Save Changes"
					onClick={() => {
						save(context)
					}}
				/>
			)}
			{hasChanges && (
				<Button
					context={context}
					id={`${id}:cancel-builder-changes`}
					icon={<Icon context={context} icon="cancel" />}
					disabled={!hasChanges}
					variant="uesio/builder.secondarytoolbar"
					label="Cancel"
					onClick={() => {
						cancel(context)
					}}
				/>
			)}
		</div>
	)
}

export default SaveCancelArea
