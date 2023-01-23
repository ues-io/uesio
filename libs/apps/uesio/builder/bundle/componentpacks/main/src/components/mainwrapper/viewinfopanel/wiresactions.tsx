import { definition, component } from "@uesio/ui"
import { set } from "../../../api/defapi"
import { FullPath } from "../../../api/path"
import BuildActionsArea from "../../../helpers/buildactionsarea"

const WiresActions: definition.UtilityComponent = (props) => {
	const Button = component.getUtility("uesio/io.button")
	const Icon = component.getUtility("uesio/io.icon")
	const { context } = props

	const path = new FullPath("viewdef", context.getViewDefId(), '["wires"]')

	return (
		<BuildActionsArea justify="space-around" context={context}>
			<Button
				context={context}
				variant="uesio/builder.actionbutton"
				icon={
					<Icon
						context={context}
						icon="add"
						variant="uesio/builder.actionicon"
					/>
				}
				label="New Wire"
				onClick={() =>
					set(
						context,
						path.addLocal(
							"newwire" + (Math.floor(Math.random() * 60) + 1)
						),
						{
							fields: null,
						},
						true
					)
				}
			/>
		</BuildActionsArea>
	)
}
WiresActions.displayName = "WiresActions"

export default WiresActions
