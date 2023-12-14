import { definition, component, hooks } from "@uesio/ui"
import { cancel, save, useHasChanges } from "../../api/defapi"

const SaveCancelArea: definition.UtilityComponent = (props) => {
	const { context, id } = props
	const Group = component.getUtility("uesio/io.group")
	const Button = component.getUtility("uesio/io.button")

	const hasChanges = useHasChanges(context)

	hooks.useHotKeyCallback("meta+s", () => {
		save(context)
	})

	hooks.useHotKeyCallback("meta+shift+c", () => {
		cancel(context)
	})

	if (!hasChanges) return null

	return (
		<Group context={context}>
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
	)
}

export default SaveCancelArea
