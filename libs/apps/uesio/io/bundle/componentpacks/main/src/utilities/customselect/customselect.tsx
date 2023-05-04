import { ReactNode } from "react"
import { definition, styles, metadata } from "@uesio/ui"
import Icon from "../icon/icon"
import Menu from "../menu/menu"
import CheckboxField from "../field/checkbox"
import Group from "../group/group"

type CustomSelectProps<T> = {
	onSelect: (item: T) => void
	onUnSelect: (item: T) => void
	items: T[] | undefined
	selectedItems?: T[]
	isSelected: (item: T) => boolean
	getItemKey: (item: T) => string
	onSearch?: (search: string) => void
	searchFilter?: (item: T, search: string) => boolean
	itemRenderer: (item: T) => ReactNode
	menuVariant?: metadata.MetadataKey
	placeholder?: string
	isMulti?: boolean
}

const StyleDefaults = Object.freeze({
	root: [],
	input: [],
	editbutton: [],
	selecteditemwrapper: [],
	notfound: [],
})

const CustomSelect: definition.UtilityComponent<CustomSelectProps<unknown>> = (
	props
) => {
	const {
		onSearch,
		searchFilter,
		isSelected,
		items = [],
		selectedItems = items ? items.filter(isSelected) : [],
		getItemKey,
		onSelect,
		onUnSelect,
		itemRenderer,
		context,
		menuVariant,
		isMulti,
	} = props

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.customselectfield"
	)

	const renderer = isMulti
		? (item: unknown) => {
				const selected = isSelected(item)
				return (
					<Group context={context}>
						<CheckboxField
							value={selected}
							setValue={() => {
								selected ? onUnSelect(item) : onSelect(item)
							}}
							context={context}
						/>
						<div>{itemRenderer(item)}</div>
					</Group>
				)
		  }
		: itemRenderer

	return (
		<Menu
			onSelect={onSelect}
			getItemKey={getItemKey}
			itemRenderer={renderer}
			items={items}
			onSearch={onSearch}
			searchFilter={searchFilter}
			context={context}
			variant={menuVariant}
			closeOnSelect={!isMulti}
		>
			<div className={classes.root}>
				<div className={classes.input}>
					{!selectedItems.length && (
						<div className={classes.notfound}>
							{context.merge(props.placeholder) ||
								"Nothing selected"}
						</div>
					)}
					{selectedItems.map((item) => (
						<div
							key={getItemKey(item)}
							className={classes.selecteditemwrapper}
						>
							{itemRenderer(item)}
							<button
								tabIndex={-1}
								className={classes.editbutton}
								type="button"
								onClick={(event) => {
									event.preventDefault() // Prevent the label from triggering
									event.stopPropagation()
									onUnSelect(item)
								}}
							>
								<Icon icon="close" context={context} />
							</button>
						</div>
					))}
				</div>
			</div>
		</Menu>
	)
}

export default CustomSelect
