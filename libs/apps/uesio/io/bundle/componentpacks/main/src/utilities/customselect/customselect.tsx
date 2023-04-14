import { ReactNode } from "react"
import { definition, styles, metadata } from "@uesio/ui"
import Icon from "../icon/icon"
import Menu from "../menu/menu"

type CustomSelectProps<T> = {
	onSelect: (item: T) => void
	onUnSelect: (item: T) => void
	items: T[] | undefined
	selectedItems: T[]
	getItemKey: (item: T) => string
	onSearch?: (search: string) => void
	searchFilter?: (item: T, search: string) => boolean
	itemRenderer: (item: T) => ReactNode
	menuVariant?: metadata.MetadataKey
}

const CustomSelect: definition.UtilityComponent<CustomSelectProps<unknown>> = (
	props
) => {
	const {
		onSearch,
		searchFilter,
		selectedItems,
		getItemKey,
		items = [],
		onSelect,
		onUnSelect,
		itemRenderer,
		context,
		menuVariant,
	} = props

	const classes = styles.useUtilityStyles(
		{
			root: {},
			input: {},
			editbutton: {},
			selecteditemwrapper: {},
		},
		props,
		"uesio/io.customselectfield"
	)

	return (
		<Menu
			onSelect={onSelect}
			getItemKey={getItemKey}
			itemRenderer={itemRenderer}
			items={items}
			onSearch={onSearch}
			searchFilter={searchFilter}
			context={context}
			variant={menuVariant}
		>
			<div className={classes.root}>
				<div className={classes.input}>
					{!selectedItems.length && <div>Nothing Selected</div>}
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
