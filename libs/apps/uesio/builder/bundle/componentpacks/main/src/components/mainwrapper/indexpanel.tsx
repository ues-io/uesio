import { definition, component, api, styles } from "@uesio/ui"
import { useDefinition } from "../../api/defapi"
import {
	getSelectedComponentOrSlotPath,
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
	root: ["w-[296px]"],
	index: ["pr-1"],
})

const IndexPanel: definition.UtilityComponent = (props) => {
	const parentContext = props.context
	const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
	const TitleBar = component.getUtility("uesio/io.titlebar")
	const IconButton = component.getUtility("uesio/io.iconbutton")
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	const selectedPath = useSelectedViewPath(parentContext)

	const dragPath = useDragPath(parentContext)
	const dropPath = useDropPath(parentContext)

	const viewDefinition = useDefinition<component.ViewDefinition>(
		parentContext,
		selectedPath.setLocal("")
	)

	const selectedComponentPath = getSelectedComponentOrSlotPath(
		selectedPath,
		viewDefinition
	)

	const [searchTerm, setSearchTerm] = useState("")

	const context = parentContext.addComponentFrame(
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
									context.getRouteContext()
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
				className={classes.index}
			>
				<IndexSlot
					slot={{
						name: "components",
						label: "View Contents",
					}}
					selectedPath={selectedComponentPath}
					definition={viewDefinition as component.ViewDefinition}
					path={""}
					context={context}
				/>
			</div>
		</ScrollPanel>
	)
}

export default IndexPanel
