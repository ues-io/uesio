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
	title: string
	path: FullPath
	tabs?: Tab[]
	selectedTab?: string
	setSelectedTab?: (selected: string) => void
	searchTerm?: string
	setSearchTerm?: (searchTerm: string) => void
	searchAreaActions?: ReactNode
	onUnselect?: () => void
}

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

	const classes = styles.useUtilityStyles(
		{
			root: {
				width: "300px",
			},
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
			{component.path.toPath(path.localPath).map((segment, index) => {
				// Try to parse the path into a number
				const num = parseInt(segment, 10)
				if (!isNaN(num)) {
					return (
						<Fragment key={index}>
							{Array.from(Array(num + 1).keys()).map((index) => (
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

	return (
		<ScrollPanel
			header={
				<>
					<TitleBar
						title={title}
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
										props.onUnselect?.()
									}}
								/>
							)
						}
						context={context}
					/>
					{tabs && !!tabs.length && (
						<TabLabels
							variant="uesio/builder.mainsection"
							styles={{
								root: {
									paddingTop: "2px",
								},
							}}
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

export { Tab }
