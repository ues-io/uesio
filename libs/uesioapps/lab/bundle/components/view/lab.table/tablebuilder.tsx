import { FunctionComponent } from "react"
import { TableProps } from "./tabledefinition"
import Table from "./table"
import { styles, component, hooks, definition, wire } from "@uesio/ui"

const BuildWrapper = component.registry.getUtility("studio.buildwrapper")
import WireHelper from "./wirehelper"
const TableBuilder: FunctionComponent<TableProps> = (props) => {
	const { context, path = "" } = props
	const uesio = hooks.useUesio(props)

	// get wire
	const [metadataType, metadataItem] = uesio.builder.useSelectedNode()
	const formDef = uesio.builder.useDefinition(
		component.path.makeFullPath(metadataType, metadataItem, path)
	) as { wire: string }
	const wire: wire.Wire | undefined = uesio.wire.useWire(formDef.wire)
	console.log({ wire })
	const classes = styles.useStyles(
		{
			inner: {
				".rowaction": {
					pointerEvents: "none",
				},
			},
		},
		{
			context,
		}
	)

	return (
		<BuildWrapper {...props} classes={classes}>
			<Table
				{...props}
				context={context.addFrame({
					buildMode: false,
				})}
			/>
			{!wire && <WireHelper {...props} />}
		</BuildWrapper>
	)
}

export default TableBuilder
