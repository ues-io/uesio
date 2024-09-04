import {
	ForwardedRef,
	forwardRef,
	HTMLAttributes,
	ReactNode,
	MouseEvent,
} from "react"
import { definition, styles } from "@uesio/ui"

interface TileUtilityProps extends definition.UtilityProps {
	avatar?: ReactNode
	onClick?: (e: MouseEvent) => void
	onDoubleClick?: (e: MouseEvent) => void
	isSelected?: boolean
	rootAttributes?: HTMLAttributes<
		HTMLDivElement | HTMLAnchorElement | HTMLButtonElement
	>
	link?: string
}

const StyleDefaults = Object.freeze({
	root: ["block"],
	content: ["empty:hidden"],
	avatar: ["empty:hidden"],
	selected: [],
	actionable: [],
})

const Tile = forwardRef<HTMLDivElement, TileUtilityProps>((props, ref) => {
	const {
		avatar,
		children,
		onClick,
		onDoubleClick,
		id,
		isSelected,
		rootAttributes,
		link,
	} = props
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.tile"
	)

	const className = styles.cx(
		classes.root,
		isSelected && classes.selected,
		onClick && classes.actionable
	)
	const avatarNode = avatar ? (
		<div className={classes.avatar}>{avatar}</div>
	) : undefined
	const childrenNode = children ? (
		<div className={classes.content}>{children}</div>
	) : undefined

	if (link && onClick) {
		return (
			<a
				{...rootAttributes}
				href={link}
				ref={ref as ForwardedRef<HTMLAnchorElement>}
				id={id}
				className={className}
				onClick={onClick}
			>
				{avatarNode}
				{childrenNode}
			</a>
		)
	}

	return (
		<div
			{...rootAttributes}
			role={onClick ? "button" : undefined}
			ref={ref}
			id={id}
			className={className}
			onClick={onClick}
			onDoubleClick={onDoubleClick}
		>
			{avatarNode}
			{childrenNode}
		</div>
	)
})

export default Tile
