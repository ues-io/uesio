import { definition, component, hooks, styles } from "@uesio/ui"
import { cancel, save, useHasChanges } from "../../api/defapi"
import { metaKey } from "./mainheader"
import { useBuildMode } from "../../api/stateapi"
import { toggleBuildMode } from "../../helpers/buildmode"

const StyleDefaults = Object.freeze({
	root: ["grid", "gap-1", "grid-cols-3", "mt-1"],
})

const SaveCancelArea: definition.UtilityComponent = (props) => {
	const { context, id } = props
	const Button = component.getUtility("uesio/io.button")

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
			{
				<Button
					context={context}
					label="Preview"
					variant="uesio/builder.secondarytoolbar"
					onClick={() => {
						toggleBuildMode(context, setBuildMode, !!buildMode)
					}}
					tooltip={`Toggle Preview / Build mode (${metaKey} + U)`}
					tooltipPlacement="left"
				/>
			}
			{
				<Button
					context={context}
					id={`${id}:save-builder-changes`}
					disabled={!hasChanges}
					variant="uesio/builder.primarytoolbar"
					label="Save"
					onClick={() => {
						save(context)
					}}
				/>
			}
			{
				<Button
					context={context}
					id={`${id}:cancel-builder-changes`}
					disabled={!hasChanges}
					variant="uesio/builder.secondarytoolbar"
					label="Cancel"
					onClick={() => {
						cancel(context)
					}}
				/>
			}
		</div>
	)
}

export default SaveCancelArea
