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
	isSelected?: boolean
	rootAttributes?: HTMLAttributes<
		HTMLDivElement | HTMLAnchorElement | HTMLButtonElement
	>
	link?: string
}

const Tile = forwardRef<HTMLDivElement, TileUtilityProps>((props, ref) => {
	const { avatar, children, onClick, id, isSelected, rootAttributes, link } =
		props
	const classes = styles.useUtilityStyles(
		{
			root: {
				all: "unset",
				userSelect: "none",
				"-webkitUserDrag": "element",
				display: "flex",
				...(onClick && {
					cursor: "pointer",
				}),
			},
			content: {
				flex: 1,
			},
			avatar: {},
			selected: {},
		},
		props,
		"uesio/io.tile"
	)

	const className = styles.cx(classes.root, isSelected && classes.selected)
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
		>
			{avatarNode}
			{childrenNode}
		</div>
	)
})

export { TileUtilityProps }
export default Tile
