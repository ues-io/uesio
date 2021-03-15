import { CSSProperties, FunctionComponent } from "react"
import { definition, component, builder, hooks } from "@uesio/ui"
import BuildPropArea from "./buildproparea/buildproparea"
import BuildActionsArea from "./buildproparea/buildactionsarea"

interface Props extends definition.BaseProps {
	propsDef?: builder.BuildPropertiesDefinition
	style?: CSSProperties
}

const ScrollPanel = component.registry.getUtility("io.scrollpanel")
const TitleBar = component.registry.getUtility("io.titlebar")
const IconButton = component.registry.getUtility("io.iconbutton")

const PropertiesPane: FunctionComponent<Props> = (props) => {
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
			{propsDef && <BuildPropArea {...props} buildPropsDef={propsDef} />}
		</ScrollPanel>
	)
}

export default PropertiesPane
