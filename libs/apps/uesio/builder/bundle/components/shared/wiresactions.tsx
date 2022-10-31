import { FunctionComponent } from "react"
import { definition, styles, component, hooks } from "@uesio/ui"

const Button = component.getUtility("uesio/io.button")
const Icon = component.getUtility("uesio/io.icon")

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
					uesio.builder.setDefinition(
						path +
							`[${
								"newwire" + (Math.floor(Math.random() * 60) + 1)
							}]`,
						{
							init: {
								query: true,
								create: false,
							},
							fields: null,
						}
					)
				}
			/>
		</div>
	)
}
WiresActions.displayName = "WiresActions"

export default WiresActions
