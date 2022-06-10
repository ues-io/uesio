import { FunctionComponent } from "react"
import { definition, styles, component } from "@uesio/ui"
import { ButtonUtilityProps } from "../button/button"
import { IconUtilityProps } from "../icon/icon"

interface Tab {
	label: string
	id: string
	icon?: string
}

interface TabsUtilityProps extends definition.UtilityProps {
	tabs: Tab[]
	selectedTab: string
	setSelectedTab: (selected: string) => void
}

const Button = component.getUtility<ButtonUtilityProps>("uesio/io.button")
const Icon = component.getUtility<IconUtilityProps>("uesio/io.icon")

const TabLabels: FunctionComponent<TabsUtilityProps> = (props) => {
	const { tabs, selectedTab, setSelectedTab, context } = props
	const classes = styles.useUtilityStyles(
		{
			root: {
				display: "grid",
				gridAutoFlow: "column",
				gridAutoColumns: "min-content",
			},
			tab: {
				cursor: "pointer",
			},
			tabSelected: {
				cursor: "default",
			},
		},
		props
	)

	return (
		<div className={classes.root}>
			{tabs?.map((tab) => (
				<Button
					context={context}
					onClick={() => {
						setSelectedTab(tab.id)
					}}
					key={tab.id}
					classes={{
						root: classes.tab,
						selected: classes.tabSelected,
					}}
					isSelected={tab.id === selectedTab}
					label={tab.label}
					icon={
						tab.icon ? (
							<Icon context={context} icon={tab.icon} />
						) : undefined
					}
				/>
			))}
		</div>
	)
}

export { TabsUtilityProps }

export default TabLabels
