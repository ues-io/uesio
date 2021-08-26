import { FunctionComponent } from "react"

import { definition, builder, styles } from "@uesio/ui"
import { component } from "@uesio/ui"

interface Props extends definition.BaseProps {
	propsDef: builder.BuildPropertiesDefinition
}

const TextField = component.registry.getUtility("io.textfield")

const BuildInfoArea: FunctionComponent<Props> = (props) => {
	const { propsDef } = props
	const classes = styles.useStyles(
		{
			wrapper: {
				overflow: "auto",
				flex: 1,
			},
			propList: {
				padding: "10px 6px 0 6px",
				position: "relative",
				"&::after": {
					content: "''",
					position: "absolute",
					left: "6px",
					right: "6px",
					height: "1px",
					backgroundColor: "#eee",
					bottom: "0",
				},
			},
		},
		props
	)

	return (
		<div className={classes.wrapper}>
			{!!propsDef?.information && (
				<div className={classes.propList}>
					<TextField
						value={propsDef.information?.description}
						mode="READ"
						label={"Description"}
						context={props.context}
					/>{" "}
					<TextField
						value={propsDef.information?.link}
						mode="READ"
						label={"Documentation"}
						context={props.context}
					/>
				</div>
			)}
		</div>
	)
}

export default BuildInfoArea
