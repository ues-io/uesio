import { FunctionComponent } from "react";
import { material } from "@uesio/ui"
import { TypographyProps } from "./typographydefinition"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: (props: TypographyProps) => ({
			margin: theme.spacing(1),
			textTransform: props.definition?.textTransform,
		}),
	})
)

const Typography: FunctionComponent<TypographyProps> = (props) => {
	const classes = useStyles(props)
	const mergedText = props.context.merge(props.definition.text)
	return (
		<material.Typography
			variant={props.definition.variant}
			className={classes.root}
			color={props.definition.color}
		>
			{mergedText}
		</material.Typography>
	)
}

export default Typography
