import { FunctionComponent, useRef } from "react"
import {
	Card,
	makeStyles,
	createStyles,
	CardActionArea,
	Popper,
	Paper,
	colors,
} from "@material-ui/core"

import { component, context } from "@uesio/ui"

type Props = {
	title: string
	icon?: string
	iconColor?: string
	selected?: boolean
	onClick?: () => void
	draggable?: string
}

const Icon = component.registry.getUtility("io.icon")

const useStyles = makeStyles((theme) =>
	createStyles({
		card: (props: Props) => ({
			margin: "0 0 4px 0",
			border: props.selected
				? `1px solid ${theme.palette.primary.light}`
				: "1px solid #eee",
			textTransform: "uppercase",
			fontSize: "9pt",
			color: "#444",
		}),
		wrapper: {
			display: "flex",
			alignItems: "center",
		},
		content: {
			margin: "8px",
			flex: 1,
		},
		icon: {
			width: "40px",
			flex: 0,
			margin: "0 0 0 8px",
			color: colors.grey[400],
		},
		popper: {
			marginLeft: "16px",
			width: "239px",
		},
		popperPaper: {
			overflow: "hidden",
		},
	})
)

const PropNodeTag: FunctionComponent<Props> = (props) => {
	const {
		title,
		onClick,
		children,
		draggable,
		icon,
		iconColor,
		selected,
	} = props

	const classes = useStyles(props)
	const ref = useRef<HTMLDivElement | null>(null)
	const innerArea = (
		<div className={classes.wrapper}>
			{icon && (
				<div className={classes.icon}>
					<Icon icon={icon} context={new context.Context()} />
				</div>
			)}
			<div className={classes.content}>{title}</div>
		</div>
	)
	return (
		<div ref={ref} draggable={!!draggable} data-type={draggable}>
			<Card elevation={0} className={classes.card}>
				{onClick ? (
					<CardActionArea disableRipple onClick={onClick}>
						{innerArea}
					</CardActionArea>
				) : (
					innerArea
				)}
			</Card>
			{selected && ref.current && children && (
				<Popper
					className={classes.popper}
					anchorEl={ref.current}
					open={true}
					placement="right"
				>
					<Paper className={classes.popperPaper}>{children}</Paper>
				</Popper>
			)}
		</div>
	)
}

export default PropNodeTag
