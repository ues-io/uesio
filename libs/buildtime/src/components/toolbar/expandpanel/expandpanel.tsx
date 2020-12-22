import { FunctionComponent, SyntheticEvent } from "react";
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
	action?: FunctionComponent<SvgIconProps>
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

const ExpandPanel: FunctionComponent<Props> = (props) => {
	const {
		children,
		action,
		actionColor,
		title,
		defaultExpanded,
		actionOnClick,
	} = props

	const summaryClasses = useSummaryStyles(props)
	const expansionClasses = useExpansionStyles(props)
	const detailClasses = useDetailStyles(props)

	return (
		<Accordion
			classes={expansionClasses}
			square
			defaultExpanded={defaultExpanded}
			elevation={0}
		>
			<AccordionSummary
				classes={summaryClasses}
				expandIcon={<ExpandMoreIcon style={{ fontSize: "1.25rem" }} />}
				IconButtonProps={{ size: "small" }}
			>
				<div style={{ flex: "1" }}>{title}</div>
				<div style={{ flex: "0" }}>
					{action && (
						<SmallIconButton
							onClick={(event: SyntheticEvent): void => {
								event.stopPropagation()
								actionOnClick?.()
							}}
							icon={action}
							color={actionColor}
						/>
					)}
				</div>
			</AccordionSummary>
			<AccordionDetails classes={detailClasses}>
				{children}
			</AccordionDetails>
		</Accordion>
	)
}

export default ExpandPanel
