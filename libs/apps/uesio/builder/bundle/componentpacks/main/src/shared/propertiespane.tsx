import { FunctionComponent, Fragment } from "react"
import { component, hooks, styles } from "@uesio/ui"
import { PropertiesPaneProps } from "./propertiespaneldefinition"
import BuildSection from "./buildproparea/buildsection"
const PropList = component.getUtility("uesio/builder.proplist")
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
			<div
				className={classes.crumb}
				style={{
					width: "16px",
				}}
			/>
			{component.path.toPath(path).map((segment, index) => {
				// Try to parse the path into a number
				const num = parseInt(segment, 10)
				if (!isNaN(num)) {
					return (
						<Fragment key={index}>
							{Array(num + 1).map((_, index) => (
								<div className={classes.crumb} key={index} />
							))}
						</Fragment>
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

	const componentId = uesio.component.getId(
		"propertiespanel" + path,
		"uesio/builder.runtime"
	)

	const [selectedTab, setSelectedTab] = uesio.component.useState<string>(
		componentId,
		""
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
									variant="uesio/builder.buildtitle"
									context={context}
									icon="close"
									onClick={(e: MouseEvent) => {
										e.stopPropagation()
										uesio.builder.unSelectNode()
									}}
								/>
							)
						}
						context={context}
					/>
					{propsDef.sections && !!propsDef.sections.length && (
						<TabLabels
							variant="uesio/builder.mainsection"
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
