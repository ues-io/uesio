import { component, definition, styles } from "@uesio/ui"
import Button from "../button/button"
import Icon from "../icon/icon"
import { TabDefinition } from "../../components/tabs/tabs"

interface TabsUtilityProps {
	tabs: TabDefinition[]
	selectedTab: string
	setSelectedTab: (selected: string) => void
}

const StyleDefaults = Object.freeze({
	root: [],
	tab: [],
	tabSelected: [],
})

const TabLabels: definition.UtilityComponent<TabsUtilityProps> = (props) => {
	const { tabs, selectedTab, setSelectedTab, context } = props
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.tablabels"
	)

	return (
		<div className={classes.root}>
			{component
				.useShouldFilter<TabDefinition>(tabs, context)
				.map((tab) => (
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

export default TabLabels
