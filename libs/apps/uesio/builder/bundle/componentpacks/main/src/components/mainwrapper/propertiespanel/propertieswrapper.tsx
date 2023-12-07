import { definition, component, styles } from "@uesio/ui"
import { Fragment, ReactNode } from "react"
import { FullPath } from "../../../api/path"
import SearchArea from "../../../helpers/searcharea"

type Tab = {
	label: string
	id: string
	icon?: string
}

type Props = {
	title?: string
	path: FullPath
	tabs?: Tab[]
	selectedTab?: string
	setSelectedTab?: (selected: string) => void
	searchTerm?: string
	setSearchTerm?: (searchTerm: string) => void
	searchAreaActions?: ReactNode
	onUnselect?: () => void
}

const getPathDots = (
	path: FullPath,
	className: string,
	wrapperClassName: string
) => (
	<div className={wrapperClassName}>
		<div
			className={className}
			style={{
				width: "16px",
			}}
		/>
		{component.path.toPath(path.localPath).map((segment, index) => {
			// Try to parse the path into a number
			const num = parseInt(segment, 10)
			if (!isNaN(num)) {
				return (
					<Fragment key={index}>
						{Array.from(Array(num + 1).keys()).map((index) => (
							<div className={className} key={index} />
						))}
					</Fragment>
				)
			}
			return (
				<div
					className={className}
					style={{
						width: segment.length + "px",
					}}
					key={index}
				/>
			)
		})}
	</div>
)

const PropertiesWrapper: definition.UtilityComponent<Props> = (props) => {
	const ScrollPanel = component.getUtility("uesio/io.scrollpanel")
	const TitleBar = component.getUtility("uesio/io.titlebar")
	const TabLabels = component.getUtility("uesio/io.tablabels")
	const IconButton = component.getUtility("uesio/io.iconbutton")

	const {
		path,
		tabs,
		selectedTab,
		setSelectedTab,
		searchTerm,
		searchAreaActions,
		setSearchTerm,
		title,
		context,
	} = props

	const classes = styles.useUtilityStyleTokens(
		{
			root: ["w-[300px]"],
			crumbwrapper: ["leading-[8px]"],
			crumb: [
				"bg-white",
				"h-[3px]",
				"w-[3px]",
				"inline-block",
				"mr-[3px]",
				"rounded-full",
			],
			tabsTitle: ["pb-2"],
		},
		props
	)

	const subtitlenode = getPathDots(path, classes.crumb, classes.crumbwrapper)

	return (
		<ScrollPanel
			id="propertieswrapper"
			variant="uesio/builder.mainsection"
			header={
				<>
					{title ? (
						<TitleBar
							title={title}
							variant="uesio/builder.primary"
							subtitlenode={subtitlenode}
							actions={
								props.path && (
									<IconButton
										variant="uesio/builder.buildtitle"
										context={context}
										icon="close"
										onClick={(e: MouseEvent) => {
											e.stopPropagation()
											props.onUnselect?.()
										}}
									/>
								)
							}
							classes={{
								content: classes.tabsTitle,
							}}
							context={context}
						/>
					) : null}
					{tabs && !!tabs.length && (
						<TabLabels
							variant="uesio/builder.mainsection"
							selectedTab={selectedTab}
							setSelectedTab={setSelectedTab}
							tabs={tabs}
							context={context}
						/>
					)}
					{setSearchTerm && (
						<SearchArea
							actions={searchAreaActions}
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							context={context}
						/>
					)}
				</>
			}
			className={styles.cx(props.className, classes.root)}
			context={context}
		>
			{props.children}
		</ScrollPanel>
	)
}

PropertiesWrapper.displayName = "PropertiesWrapper"

export default PropertiesWrapper

export { getPathDots }

export type { Tab }
