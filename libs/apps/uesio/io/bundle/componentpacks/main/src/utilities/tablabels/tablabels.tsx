import { component, definition, styles } from "@uesio/ui"
import Button from "../button/button"
import Icon from "../icon/icon"
import { TabDefinition } from "../../components/tabs/tabs"
import useResizeObserver from "@react-hook/resize-observer"
import { useRef, useState } from "react"
import MenuButton from "../menubutton/menubutton"

interface TabsUtilityProps {
	tabs: TabDefinition[]
	selectedTab: string
	setSelectedTab: (selected: string) => void
}

type SizeState = {
	fullWidth: number
	childSizes: number[]
}

const StyleDefaults = Object.freeze({
	root: ["relative"],
	tab: [],
	tabSelected: [],
	hidden: ["invisible"],
	menuWrapper: ["absolute", "top-1/2", "translate-y-[-50%]", "right-2"],
	menuButton: ["p-1", "text-base", "self-center"],
})

const MENU_WIDTH = 30

const TabLabels: definition.UtilityComponent<TabsUtilityProps> = (props) => {
	const { tabs, selectedTab, setSelectedTab, context } = props
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.tablabels"
	)

	const target = useRef(null)
	const [sizes, setSizes] = useState<SizeState>({
		fullWidth: 0,
		childSizes: [],
	})

	useResizeObserver(target, (entry) => {
		setSizes({
			fullWidth: entry.target.clientWidth,
			childSizes: Array.from(entry.target.children).map(
				(child) => child.clientWidth
			),
		})
	})

	let currentLabelWidth = 0 // Keeps track of with of all tablabels while iterating
	const overflowTabs: TabDefinition[] = [] // Keeps track of tabs that need to be in a separate menu

	return (
		<div ref={target} className={classes.root}>
			{component
				.useShouldFilter<TabDefinition>(tabs, context)
				.map((tab, index) => {
					currentLabelWidth += sizes.childSizes[index]
					const isLast = index === tabs.length - 1
					const menuWidth = isLast ? 0 : MENU_WIDTH
					const isVisible =
						currentLabelWidth < sizes.fullWidth - menuWidth
					if (!isVisible) overflowTabs.push(tab)
					return (
						<Button
							context={context}
							onClick={() => {
								setSelectedTab(tab.id)
							}}
							key={tab.id}
							classes={{
								root: styles.cx(
									!isVisible && classes.hidden,
									classes.tab
								),
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
					)
				})}
			{!!overflowTabs.length && (
				<div className={classes.menuWrapper}>
					<MenuButton
						onSelect={(tab: TabDefinition) => {
							setSelectedTab(tab.id)
						}}
						getItemKey={(tab: TabDefinition) => tab.id}
						itemRenderer={(tab: TabDefinition) => (
							<div>{tab.label}</div>
						)}
						context={context}
						items={overflowTabs}
						icon="more_vert"
						className={classes.menuButton}
					/>
				</div>
			)}
		</div>
	)
}

export default TabLabels
