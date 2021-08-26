import { FunctionComponent } from "react"
import { component, hooks } from "@uesio/ui"
import BuildPropArea from "./buildproparea/buildproparea"
import BuildInfoArea from "./buildproparea/buildinfoarea"
import BuildActionsArea from "./buildproparea/buildactionsarea"
import { PropertiesPaneProps } from "./propertiespaneldefinition"

const ScrollPanel = component.registry.getUtility("io.scrollpanel")
const TitleBar = component.registry.getUtility("io.titlebar")
const IconButton = component.registry.getUtility("io.iconbutton")

const PropertiesPane: FunctionComponent<PropertiesPaneProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { propsDef, path, context, valueAPI, className } = props
	const [metadataType] = uesio.builder.useSelectedNode()

	const subtitle = path
		? component.path.toPath(path).join(" > ")
		: "No Element Selected"
	return (
		<ScrollPanel
			header={
				<TitleBar
					title={propsDef?.title || "Properties"}
					variant="io.primary"
					subtitle={subtitle}
					actions={
						props.path && (
							<IconButton
								context={context}
								variant="io.small"
								icon="close"
								onClick={() =>
									uesio.builder.clearSelectedNode()
								}
							/>
						)
					}
					context={context}
				/>
			}
			footer={
				propsDef && (
					<BuildActionsArea
						path={path}
						context={context}
						valueAPI={valueAPI}
						actions={propsDef.actions}
					/>
				)
			}
			className={className}
			context={context}
		>
			{metadataType !== "componenttype"
				? propsDef && (
						<BuildPropArea
							path={path}
							valueAPI={valueAPI}
							context={context}
							propsDef={propsDef}
						/>
				  )
				: propsDef && (
						<BuildInfoArea
							path={path}
							context={context}
							propsDef={propsDef}
						/>
				  )}
		</ScrollPanel>
	)
}
PropertiesPane.displayName = "PropertiesPane"

export default PropertiesPane
