import { useState, ReactNode, useRef } from "react"
import { definition, styles } from "@uesio/ui"
import {
	autoPlacement,
	useFloating,
	autoUpdate,
	offset,
	FloatingPortal,
	useListNavigation,
	useInteractions,
	useDismiss,
	useClick,
	useRole,
	FloatingFocusManager,
} from "@floating-ui/react"

interface MenuButtonUtilityProps<T> extends definition.UtilityProps {
	itemRenderer: (item: T) => ReactNode
	onSelect: (item: T) => void
	items: T[]
	getItemKey: (item: T) => string
	onSearch?: (search: string) => void
	searchFilter?: (item: T, search: string) => boolean
}

const Menu: definition.UtilityComponent<MenuButtonUtilityProps<unknown>> = (
	props
) => {
	const classes = styles.useUtilityStyles(
		{
			root: {},
			menu: {},
			menuheader: {},
			menuitem: {},
			highlighted: {},
			searchbox: {},
			itemsarea: {},
		},
		props,
		"uesio/io.menu"
	)

	const [isOpen, setIsOpen] = useState(false)
	const [searchText, setSearchText] = useState("")

	const floating = useFloating({
		open: isOpen,
		onOpenChange: setIsOpen,
		placement: "bottom-start",
		middleware: [
			offset(2),
			autoPlacement({ allowedPlacements: ["top-start", "bottom-start"] }),
		],
		whileElementsMounted: autoUpdate,
	})

	const { x, y, strategy, refs } = floating

	const listRef = useRef<(HTMLDivElement | null)[]>([])

	const [activeIndex, setActiveIndex] = useState<number | null>(null)

	const dismiss = useDismiss(floating.context)
	const click = useClick(floating.context)
	const role = useRole(floating.context, { role: "listbox" })

	const listNavigation = useListNavigation(floating.context, {
		listRef,
		activeIndex,
		onNavigate: setActiveIndex,
		focusItemOnOpen: false,
	})

	const { getReferenceProps, getFloatingProps, getItemProps } =
		useInteractions([click, dismiss, role, listNavigation])

	const {
		items,
		itemRenderer,
		onSelect,
		onSearch,
		searchFilter,
		getItemKey,
		children,
	} = props

	return (
		<>
			<div
				className="flex"
				tabIndex={0}
				ref={refs.setReference}
				{...getReferenceProps()}
			>
				{children}
			</div>
			<FloatingPortal>
				{isOpen && (
					<FloatingFocusManager
						context={floating.context}
						modal={false}
					>
						<div
							ref={refs.setFloating}
							style={{
								position: strategy,
								top: y ?? 0,
								left: x ?? 0,
							}}
							className={classes.menu}
							{...getFloatingProps()}
						>
							<div className={classes.menuheader}>
								{(onSearch || searchFilter) && (
									<input
										type="text"
										value={searchText}
										autoFocus
										className={classes.searchbox}
										placeholder="Search..."
										onChange={(e) => {
											onSearch?.(e.target.value)
											setSearchText(e.target.value)
										}}
									/>
								)}
							</div>
							<div className={classes.itemsarea}>
								{items
									.filter((item) => {
										if (!searchFilter) return true
										if (!searchText) return true
										return searchFilter(item, searchText)
									})
									.map((item, index) => (
										<div
											className={styles.cx(
												classes.menuitem,
												activeIndex === index &&
													classes.highlighted
											)}
											key={getItemKey(item)}
											tabIndex={
												activeIndex === index ? 0 : -1
											}
											ref={(node) => {
												listRef.current[index] = node
											}}
											role="option"
											{...getItemProps({
												// Handle pointer select.
												onClick() {
													onSelect(item)
													setIsOpen(false)
												},
												// Handle keyboard select.
												onKeyDown(event) {
													if (event.key === "Enter") {
														event.preventDefault()
														onSelect(item)
														setIsOpen(false)
													}
												},
											})}
										>
											{itemRenderer(item)}
										</div>
									))}
							</div>
						</div>
					</FloatingFocusManager>
				)}
			</FloatingPortal>
		</>
	)
}

export default Menu
