import { definition, component, api, styles } from "@uesio/ui"
import { useDefinition } from "../../api/defapi"
import { useSelectedViewPath } from "../../api/stateapi"
import IndexComponent from "./indexcomponent"
import SearchArea from "../../helpers/searcharea"
import { useState } from "react"

const StyleDefaults = Object.freeze({
	root: [],
})

const IndexPanel: definition.UtilityComponent = (props) => {
	const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
	const TitleBar = component.getUtility("uesio/io.titlebar")
	const IconButton = component.getUtility("uesio/io.iconbutton")
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	const selectedPath = useSelectedViewPath(props.context)

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
			{component
				.getSlotProps({
					listName: "components",
					definition,
					path: "",
					context,
				})
				.map((props, index) => (
					<IndexComponent
						{...props}
						definition={{
							...props.definition,
							searchTerm,
						}}
						key={index}
					/>
				))}
		</ScrollPanel>
	)
}

export default IndexPanel
