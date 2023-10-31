import { definition, component, api, styles } from "@uesio/ui"
import { useDefinition } from "../../api/defapi"
import {
	useDragPath,
	useDropPath,
	useSelectedViewPath,
} from "../../api/stateapi"
import SearchArea from "../../helpers/searcharea"
import { useState } from "react"
import {
	getDragEndHandler,
	getDragOverHandler,
	getDragStartHandler,
	getDropHandler,
} from "../../helpers/dragdrop"
import IndexSlot from "./indexslot"

const StyleDefaults = Object.freeze({
	root: [],
})

const IndexPanel: definition.UtilityComponent = (props) => {
	const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
	const TitleBar = component.getUtility("uesio/io.titlebar")
	const IconButton = component.getUtility("uesio/io.iconbutton")
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	const selectedPath = useSelectedViewPath(props.context)

	const dragPath = useDragPath(props.context)
	const dropPath = useDropPath(props.context)

	const definition = useDefinition(
		selectedPath.setLocal("")
	) as definition.DefinitionMap

	const [searchTerm, setSearchTerm] = useState("")

	const context = props.context.addComponentFrame(
		"uesio/builder.indexpanel",
		{
			searchTerm,
		}
	)

	return (
		<ScrollPanel
			variant="uesio/builder.mainsection"
			header={
				<>
					<TitleBar
						variant="uesio/builder.primary"
						title={"component index"}
						actions={
							<IconButton
								context={context}
								variant="uesio/builder.buildtitle"
								icon="close"
								onClick={api.signal.getHandler(
									[
										{
											signal: "component/CALL",
											component:
												"uesio/builder.mainwrapper",
											componentsignal: "TOGGLE_INDEX",
										},
									],
									context
								)}
							/>
						}
						context={context}
					/>
					<SearchArea
						searchTerm={searchTerm}
						setSearchTerm={setSearchTerm}
						context={context}
					/>
				</>
			}
			context={context}
			className={classes.root}
		>
			<div
				onDragStart={getDragStartHandler(context)}
				onDragEnd={getDragEndHandler(context)}
				onDragOver={getDragOverHandler(context, dragPath, dropPath)}
				onDrop={getDropHandler(context, dragPath, dropPath)}
			>
				{
					<IndexSlot
						slot={{
							name: "components",
						}}
						definition={definition}
						path={""}
						context={context}
					/>
				}
			</div>
		</ScrollPanel>
	)
}

export default IndexPanel
