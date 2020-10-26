import React, {
	ReactElement,
	PropsWithChildren,
	FC,
	SyntheticEvent,
} from "react"
import {
	AccordionSummary,
	Accordion,
	AccordionDetails,
	makeStyles,
	createStyles,
	SvgIconProps,
} from "@material-ui/core"

import ExpandMoreIcon from "@material-ui/icons/ExpandMore"
import SmallIconButton from "../smalliconbutton"

interface Props {
	title: string
	defaultExpanded: boolean
	action?: FC<SvgIconProps>
	actionColor?: string
	actionOnClick?: () => void
}

const useSummaryStyles = makeStyles(() =>
	createStyles({
		root: {
			minHeight: "unset",
			padding: "4px 8px",
			"&$expanded": {
				minHeight: "unset",
			},
		},
		content: {
			textTransform: "uppercase",
			fontSize: "9pt",
			color: "#444",
			margin: "unset",
			"&$expanded": {
				margin: "unset",
			},
			"&$expanded div:last-child": {
				display: "unset",
			},
			"&$expanded div:first-child": {
				marginTop: "2px",
			},
			"& div:last-child": {
				display: "none",
			},
		},
		expanded: {},
	})
)

const useExpansionStyles = makeStyles(() =>
	createStyles({
		root: {
			background: "#f5f5f5",
			borderBottom: "1px solid #ccc",
			"&$expanded": {
				margin: "unset",
			},
			"&:before": {
				opacity: 0,
			},
		},
		expanded: {},
	})
)

const useDetailStyles = makeStyles(() =>
	createStyles({
		root: {
			display: "block",
			padding: "6px",
			background: "#f5f5f5",
		},
	})
)

function ExpandPanel(props: PropsWithChildren<Props>): ReactElement {
	const summaryClasses = useSummaryStyles(props)
	const expansionClasses = useExpansionStyles(props)
	const detailClasses = useDetailStyles(props)

	return (
		<Accordion
			classes={expansionClasses}
			square
			defaultExpanded={props.defaultExpanded}
			elevation={0}
		>
			<AccordionSummary
				classes={summaryClasses}
				expandIcon={
					<ExpandMoreIcon
						style={{
							fontSize: "1.25rem",
						}}
					/>
				}
				IconButtonProps={{
					size: "small",
				}}
			>
				<div
					style={{
						flex: "1",
					}}
				>
					{props.title}
				</div>
				<div
					style={{
						flex: "0",
					}}
				>
					{props.action && (
						<SmallIconButton
							onClick={(event: SyntheticEvent): void => {
								event.stopPropagation()
								props.actionOnClick?.()
							}}
							icon={props.action}
							color={props.actionColor}
						/>
					)}
				</div>
			</AccordionSummary>
			<AccordionDetails classes={detailClasses}>
				{props.children}
			</AccordionDetails>
		</Accordion>
	)
}

export default ExpandPanel
