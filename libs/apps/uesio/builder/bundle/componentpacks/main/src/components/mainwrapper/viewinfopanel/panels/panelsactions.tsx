import { definition, styles, component } from "@uesio/ui"
import { set } from "../../../../api/defapi"
import { FullPath } from "../../../../api/path"

const PanelsActions: definition.UtilityComponent = (props) => {
	const Button = component.getUtility("uesio/io.button")
	const Icon = component.getUtility("uesio/io.icon")
	const { context } = props
	const path = new FullPath("viewdef", context.getViewDefId(), '["panels"]')
	const classes = styles.useUtilityStyles(
		{
			wrapper: {
				display: "flex",
				justifyContent: "space-around",
				padding: "8px",
				position: "relative",
				backgroundColor: "#fcfcfc",
			},
		},
		props
	)
	return (
		<div className={classes.wrapper}>
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
				label="New Panel"
				onClick={() =>
					set(
						context,
						path.addLocal(
							"newpanel" + (Math.floor(Math.random() * 60) + 1)
						),
						{
							"uesio.type": "uesio/io.dialog",
							components: [],
						}
					)
				}
			/>
		</div>
	)
}
PanelsActions.displayName = "PanelsActions"

export default PanelsActions
