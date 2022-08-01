import { FunctionComponent } from "react"
import { component, hooks, styles } from "@uesio/ui"
import BuildActionsArea from "./buildproparea/buildactionsarea"
import { PropertiesPaneProps } from "./propertiespaneldefinition"
import PropList from "./buildproparea/proplist"
import BuildSection from "./buildproparea/buildsection"
const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
const TitleBar = component.getUtility("uesio/io.titlebar")
const TabLabels = component.getUtility("uesio/io.tablabels")
const IconButton = component.getUtility("uesio/io.iconbutton")

const PropertiesPane: FunctionComponent<PropertiesPaneProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { propsDef, path = "", context, valueAPI, className } = props

	const classes = styles.useUtilityStyles(
		{
			crumbwrapper: {
				lineHeight: "10px",
			},
			crumb: {
				background: "white",
				height: "3px",
				width: "3px",
				display: "inline-block",
				marginRight: "3px",
				borderRadius: "3px",
			},
		},
		props
	)
	const subtitlenode = (
		<div className={classes.crumbwrapper}>
			{component.path.toPath(path).map((segment, index) => {
				// Try to parse the path into a number
				const num = parseInt(segment, 10)
				if (!isNaN(num)) {
					return (
						<>
							{[...Array(num + 1)].map((index) => (
								<div className={classes.crumb} key={index} />
							))}
						</>
					)
				}
				return (
					<div
						className={classes.crumb}
						style={{
							width: segment.length + "px",
						}}
						key={index}
					/>
				)
			})}
		</div>
	)

	const [selectedTab, setSelectedTab] = uesio.component.useState<string>(
		"propertiespanel:" + path,
		"",
		undefined,
		"uesio/studio.runtime"
	)

	const selectedSection = propsDef.sections?.find(
		(section, index) => section.title + index === selectedTab
	)

	return (
		<ScrollPanel
			header={
				<>
					<TitleBar
						title={propsDef.title || "Properties"}
						variant="uesio/io.primary"
						subtitlenode={subtitlenode}
						actions={
							props.path && (
								<IconButton
									variant="uesio/studio.buildtitle"
									context={context}
									icon="close"
									onClick={() => uesio.builder.unSelectNode()}
								/>
							)
						}
						context={context}
					/>
					{propsDef.sections && (
						<TabLabels
							variant="uesio/studio.mainsection"
							styles={{
								root: {
									paddingTop: "2px",
								},
							}}
							selectedTab={selectedTab}
							setSelectedTab={setSelectedTab}
							tabs={[{ id: "", label: "", icon: "home" }].concat(
								propsDef.sections.map((section, index) => ({
									id: section.title + index,
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
