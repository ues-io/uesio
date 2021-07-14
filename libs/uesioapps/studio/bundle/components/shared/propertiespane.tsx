import { CSSProperties, FunctionComponent } from "react"
import { definition, component, builder, hooks } from "@uesio/ui"
import BuildPropAreaVariant from "./buildproparea/buildpropareavariant"
import BuildActionsArea from "./buildproparea/buildactionsarea"

interface Props extends definition.BaseProps {
	propsDef?: builder.BuildPropertiesDefinition
	style?: CSSProperties
}

const ScrollPanel = component.registry.getUtility("io.scrollpanel")
const TitleBar = component.registry.getUtility("io.titlebar")
const IconButton = component.registry.getUtility("io.iconbutton")

const PropertiesPane: FunctionComponent<Props> = (props) => {
	const isVariant = true
	const uesio = hooks.useUesio(props)
	const propsDef = props.propsDef
	const subtitle = props.path
		? component.path.toPath(props.path).join(" > ")
		: "No Element Selected"
	return (
		<ScrollPanel
			style={props.style}
			header={
				<TitleBar
					title={propsDef?.title || "Properties"}
					variant="io.primary"
					subtitle={subtitle}
					actions={
						props.path && (
							<IconButton
								{...props}
								variant="io.small"
								icon="close"
								onClick={() =>
									uesio.builder.setSelectedNode("")
								}
							/>
						)
					}
					{...props}
				/>
			}
			footer={
				propsDef && (
					<BuildActionsArea {...props} actions={propsDef.actions} />
				)
			}
			{...props}
		>
			{isVariant && propsDef && (
				<BuildPropAreaVariant {...props} buildPropsDef={propsDef} />
			)}
		</ScrollPanel>
	)
}
PropertiesPane.displayName = "PropertiesPane"

export default PropertiesPane
