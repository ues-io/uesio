import { FunctionComponent } from "react"
import { definition, styles, component, hooks } from "@uesio/ui"

const Button = component.registry.getUtility("io.button")
const Icon = component.registry.getUtility("io.icon")

const ParamsActions: FunctionComponent<definition.UtilityProps> = (props) => {
	const { context } = props
	const uesio = hooks.useUesio(props)
	const metadataType = "viewdef"
	const metadataItem = uesio.getViewDefId() || ""
	const localPath = '["params"]'
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
				variant="studio.actionbutton"
				icon={
					<Icon
						context={context}
						icon="add"
						variant="studio.actionicon"
					/>
				}
				label="New Parameter"
				onClick={() =>
					uesio.builder.addDefinitionPair(
						path,
						{
							type: "recordId",
						},
						"newparam" + (Math.floor(Math.random() * 60) + 1),
						"params"
					)
				}
			/>
		</div>
	)
}
ParamsActions.displayName = "ParamsActions"

export default ParamsActions
