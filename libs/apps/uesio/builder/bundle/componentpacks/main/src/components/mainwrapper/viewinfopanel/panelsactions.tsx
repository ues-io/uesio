import { FunctionComponent } from "react"
import { definition, styles, component } from "@uesio/ui"
import { set } from "../../../api/defapi"

const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")

const PanelsActions: FunctionComponent<definition.UtilityProps> = (props) => {
	const { context } = props
	const metadataType = "viewdef"
	const metadataItem = context.getViewDefId() || ""
	const localPath = '["panels"]'
	const path = component.path.makeFullPath(
		metadataType,
		metadataItem,
		localPath
	)
	const classes = styles.useStyles(
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
						path +
							`[${
								"newpanel" +
								(Math.floor(Math.random() * 60) + 1)
							}]`,
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
