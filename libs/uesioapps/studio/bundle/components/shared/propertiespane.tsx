import { FunctionComponent } from "react"
import { definition, component, builder, hooks } from "@uesio/ui"
import BuildPropArea from "./buildproparea/buildproparea"
import BuildActionsArea from "./buildproparea/buildactionsarea"

interface Props extends definition.UtilityProps {
	propsDef?: builder.BuildPropertiesDefinition
	setValue: (path: string, value: definition.DefinitionValue) => void
	getValue: (path: string) => definition.Definition
}

const ScrollPanel = component.registry.getUtility("io.scrollpanel")
const TitleBar = component.registry.getUtility("io.titlebar")
const IconButton = component.registry.getUtility("io.iconbutton")

const PropertiesPane: FunctionComponent<Props> = (props) => {
	const uesio = hooks.useUesio(props)
	const { propsDef, path, context, getValue, setValue, className } = props
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
						getValue={getValue}
						actions={propsDef.actions}
					/>
				)
			}
			className={className}
			context={context}
		>
			{propsDef && (
				<BuildPropArea
					path={path}
					setValue={setValue}
					getValue={getValue}
					context={context}
					propsDef={propsDef}
				/>
			)}
		</ScrollPanel>
	)
}
PropertiesPane.displayName = "PropertiesPane"

export default PropertiesPane
