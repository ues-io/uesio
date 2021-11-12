import { FunctionComponent } from "react"
import { component, hooks } from "@uesio/ui"
import BuildActionsArea from "./buildproparea/buildactionsarea"
import { PropertiesPaneProps } from "./propertiespaneldefinition"
import PropList from "./buildproparea/proplist"
import BuildSection from "./buildproparea/buildsection"

const ScrollPanel = component.registry.getUtility("io.scrollpanel")
const TitleBar = component.registry.getUtility("io.titlebar")
const Tabs = component.registry.getUtility("io.tabs")
const IconButton = component.registry.getUtility("io.iconbutton")

const PropertiesPane: FunctionComponent<PropertiesPaneProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { propsDef, path, context, valueAPI, className } = props

	console.log("BEST", { propsDef })

	const subtitle = path
		? component.path.toPath(path).join(" > ")
		: "No Element Selected"

	const [selectedTab, setSelectedTab] = uesio.component.useState<string>(
		"propertiespanel:" + path,
		"",
		undefined,
		"uesio.runtime"
	)

	const sections = propsDef?.sections
	const selectedSection = sections?.find(
		(section) => section.title === selectedTab
	)

	return (
		<ScrollPanel
			header={
				<>
					<TitleBar
						title={propsDef?.title || "Properties"}
						variant="io.primary"
						subtitle={subtitle}
						actions={
							props.path && (
								<IconButton
									context={context}
									icon="close"
									onClick={() =>
										uesio.builder.clearSelectedNode()
									}
								/>
							)
						}
						context={context}
					/>
					{sections && (
						<Tabs
							variant="studio.mainsection"
							selectedTab={selectedTab}
							setSelectedTab={setSelectedTab}
							tabs={[{ id: "", label: "", icon: "home" }].concat(
								sections.map((section) => ({
									id: section.title,
									label: section.title,
									icon: "",
								}))
							)}
							context={context}
						/>
					)}
				</>
			}
			footer={
				propsDef && (
					<BuildActionsArea
						path={path}
						context={context}
						valueAPI={valueAPI}
						actions={propsDef.actions}
						propsDef={propsDef}
					/>
				)
			}
			className={className}
			context={context}
		>
			{selectedTab === "" && propsDef && propsDef.properties && (
				<PropList
					path={path}
					propsDef={propsDef}
					properties={propsDef.properties}
					context={context}
					valueAPI={valueAPI}
				/>
			)}
			{selectedSection && propsDef && (
				<BuildSection
					path={path}
					propsDef={propsDef}
					section={selectedSection}
					context={context}
					valueAPI={valueAPI}
				/>
			)}
		</ScrollPanel>
	)
}
PropertiesPane.displayName = "PropertiesPane"

export default PropertiesPane
