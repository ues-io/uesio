import React, { FunctionComponent, useRef, ReactNode } from "react"
import {
	Card,
	makeStyles,
	createStyles,
	SvgIconProps,
	CardActionArea,
	Popper,
	Paper,
} from "@material-ui/core"
import { material } from "@uesio/ui"

type Props = {
	title: string
	icon?: FunctionComponent<SvgIconProps>
	iconColor?: string
	selected?: boolean
	onClick?: () => void
	children?: ReactNode
	draggable?: string
}

const useStyles = makeStyles((theme) =>
	createStyles({
		card: (props: Props) => ({
			margin: "0 0px 4px 0px",
			border: props.selected
				? "1px solid " + theme.palette.primary.light
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
			flex: "1",
		},
		icon: {
			width: "40px",
			flex: "0",
			margin: "0 0 0 8px",
			color: material.colors.grey[400],
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
	const classes = useStyles(props)
	const ref = useRef<HTMLDivElement>(null)
	const innerArea = (
		<div className={classes.wrapper}>
			{props.icon && (
				<div className={classes.icon}>
					<props.icon
						style={{
							fontSize: "0.9rem",
							display: "block",
							color: props.iconColor,
						}}
					/>
				</div>
			)}
			<div className={classes.content}>{props.title}</div>
		</div>
	)
	return (
		<div
			ref={ref}
			draggable={!!props.draggable}
			data-type={props.draggable}
		>
			<Card elevation={0} className={classes.card}>
				{props.onClick ? (
					<CardActionArea disableRipple onClick={props.onClick}>
						{innerArea}
					</CardActionArea>
				) : (
					innerArea
				)}
			</Card>
			{props.selected && ref.current && props.children && (
				<Popper
					className={classes.popper}
					anchorEl={ref.current}
					open={true}
					placement="right"
				>
					<Paper className={classes.popperPaper}>
						{props.children}
					</Paper>
				</Popper>
			)}
		</div>
	)
}

export default PropNodeTag
