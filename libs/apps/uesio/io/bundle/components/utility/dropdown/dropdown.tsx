import React, { FC, useState, useRef, useEffect } from "react"
import { definition, styles, component } from "@uesio/ui"
import { CSSTransition } from "react-transition-group"
import type { Placement } from "@popperjs/core"

const Popper = component.getUtility("uesio/io.popper")

interface DropdownProps extends definition.UtilityProps {
	onSelect: () => void
	options: { label: string; onClick: () => void }[]
	TriggerElement: React.ReactElement
	placement?: Placement
}

const Dropdown: FC<DropdownProps> = (props) => {
	const { options, context, TriggerElement } = props
	const [anchorEl, setAnchorEl] = useState<HTMLSpanElement | null>(null)
	const [focusedIndex, setFocusedIndex] = useState(0)
	const refs = useRef<(HTMLLIElement | null)[]>([])

	const [isOpen, setIsOpen] = useState(false)

	const classes = styles.useUtilityStyles(
		{
			root: {},
			menu: {
				paddingLeft: 0,
				background: "#fff",
				overflow: "hidden",
				margin: 0,
			},
			menuItem: {
				listStyle: "none",
				cursor: "pointer",
			},
			menuItemFocused: {
				outline: "none",
			},
			menuAnimation: {},
		},
		props
	)

	const keyPressHandler = (e: KeyboardEvent) => {
		if (e.key === "ArrowUp") {
			setFocusedIndex((curr) =>
				curr === 0 ? options.length - 1 : curr - 1
			)
		}
		if (e.key === "ArrowDown") {
			setFocusedIndex((curr) =>
				curr === options.length - 1 ? 0 : curr + 1
			)
		}
		if (e.key === "Enter") {
			setFocusedIndex((curr) => {
				options[curr].onClick()
				return curr
			})
		}
	}

	useEffect(() => {
		refs.current[focusedIndex]?.focus()
	}, [focusedIndex])

	useEffect(() => {
		setFocusedIndex(0)
		refs.current[0]?.focus()
		if (isOpen) window.addEventListener("keyup", keyPressHandler)
		return () => {
			window.removeEventListener("keyup", keyPressHandler)
		}
	}, [isOpen])

	return (
		<div className={classes.root}>
			<span
				aria-expanded={isOpen}
				tabIndex={-1}
				ref={setAnchorEl}
				onClick={() => setIsOpen(!isOpen)}
			>
				{TriggerElement}
			</span>

			<CSSTransition
				in={isOpen}
				timeout={300}
				classNames={classes.menuAnimation}
			>
				{isOpen ? (
					<Popper
						referenceEl={anchorEl}
						context={context}
						placement={props.placement || "bottom-end"}
						onOutsideClick={() => setIsOpen(false)}
					>
						<ul className={classes.menu}>
							{options?.map((el, i) => (
								<li
									tabIndex={-1}
									className={styles.cx([
										classes.menuItem,
										i === focusedIndex
											? classes.menuItemFocused
											: null,
									])}
									onMouseOver={() => {
										setFocusedIndex(i)
									}}
									onClick={el.onClick}
									key={el.label}
									ref={(el) => (refs.current[i] = el)}
								>
									{el.label}
								</li>
							))}
						</ul>
					</Popper>
				) : (
					() => null
				)}
			</CSSTransition>
		</div>
	)
}

export default Dropdown
