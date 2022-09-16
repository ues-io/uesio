import React, { FC } from "react"
import {
	useSelect,
	UseSelectStateChangeOptions,
	UseSelectState,
} from "downshift"
import { definition, styles } from "@uesio/ui"

type Item = { label: string; onClick: () => void }
interface DropdownProps extends definition.UtilityProps {
	onSelect: () => void
	options: { label: string; onClick: () => void }[]
	TriggerElement: React.ReactElement
}

const Dropdown: FC<DropdownProps> = (props) => {
	function itemToString(item: Item) {
		return item ? item.label : ""
	}

	const classes = styles.useUtilityStyles(
		{
			root: {},
			triggerWrapper: {}
			menu: {
				paddingLeft: 0,
				background: "#fff",
				overflow: "hidden",
				margin: 0,
				position: "absolute",
			},
			item: {
				listStyle: "none",
				cursor: "pointer",
			},
			itemHighlighted: {
				outline: "none",
			},
			itemLabel: {},
			menuAnimation: {},
		},
		props
	)

	const stateReducer = (
		state: UseSelectState<Item>,
		actionAndChanges: UseSelectStateChangeOptions<Item>
	) => {
		const { type, changes } = actionAndChanges
		const { ItemClick, MenuKeyDownEnter, MenuBlur } =
			useSelect.stateChangeTypes
		switch (type) {
			case ItemClick:
			case MenuKeyDownEnter:
				changes.selectedItem?.onClick()
				return { selectedItem: props.options[0] }
			case MenuBlur:
				return { selectedItem: props.options[0] }
			default:
				return changes
		}
	}

	function Select() {
		const {
			isOpen,
			getToggleButtonProps,
			getMenuProps,
			highlightedIndex,
			getItemProps,
		} = useSelect({
			items: props.options,
			itemToString,
			stateReducer,
		})

		return (
			<div className={classes.root}>
				<span classes={classes.triggerWrapper} {...getToggleButtonProps()}>{props.TriggerElement}</span>

				<ul {...getMenuProps()} className={classes.menu}>
					{isOpen &&
						props.options.map((item, index) => (
							<li
								className={styles.cx([
									classes.item,
									highlightedIndex === index
										&& classes.itemHighlighted,
								])}
								key={index}
								{...getItemProps({ item, index })}
							>
								<span className={classes.itemLabel}>{item.label}</span>
							</li>
						))}
				</ul>
			</div>
		)
	}

	return <Select />
}

export default Dropdown
