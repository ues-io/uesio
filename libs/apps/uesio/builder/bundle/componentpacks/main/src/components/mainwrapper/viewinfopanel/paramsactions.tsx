import { definition, styles, component } from "@uesio/ui"
import { set } from "../../../api/defapi"

const ParamsActions: definition.UtilityComponent = (props) => {
	const Button = component.getUtility("uesio/io.button")
	const Icon = component.getUtility("uesio/io.icon")
	const { context } = props
	const metadataType = "viewdef"
	const metadataItem = context.getViewDefId() || ""
	const localPath = '["params"]'
	const path = component.path.makeFullPath(
		metadataType,
		metadataItem,
		localPath
	)
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
				label="New Parameter"
				onClick={() =>
					set(
						path +
							`[${
								"newparam" +
								(Math.floor(Math.random() * 60) + 1)
							}]`,
						{
							type: "recordId",
						}
					)
				}
			/>
		</div>
	)
}
ParamsActions.displayName = "ParamsActions"

export default ParamsActions
