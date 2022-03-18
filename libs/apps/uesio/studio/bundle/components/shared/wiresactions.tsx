import { FunctionComponent } from "react"
import { definition, styles, component, hooks } from "@uesio/ui"

const Button = component.registry.getUtility("uesio/io.button")
const Icon = component.registry.getUtility("uesio/io.icon")

const WiresActions: FunctionComponent<definition.UtilityProps> = (props) => {
	const { context } = props
	const uesio = hooks.useUesio(props)
	const metadataType = "viewdef"
	const metadataItem = uesio.getViewDefId() || ""
	const localPath = '["wires"]'
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
				label="New Wire"
				onClick={() =>
					uesio.builder.addDefinitionPair(
						path,
						{
							type: "",
							fields: null,
						},
						"newwire" + (Math.floor(Math.random() * 60) + 1),
						"wire"
					)
				}
			/>
		</div>
	)
}
WiresActions.displayName = "WiresActions"

export default WiresActions
