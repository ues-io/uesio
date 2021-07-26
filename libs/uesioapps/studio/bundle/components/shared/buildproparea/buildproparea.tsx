import { FunctionComponent } from "react"

import { definition, builder, styles } from "@uesio/ui"
import BuildSection from "./buildsection"
import PropList from "./proplist"
import { ValueAPI } from "../propertiespaneldefinition"

interface Props extends definition.BaseProps {
	propsDef: builder.BuildPropertiesDefinition
	valueAPI: ValueAPI
}

const BuildPropArea: FunctionComponent<Props> = (props) => {
	const { propsDef, path, context, valueAPI } = props
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

	const sections =
		propsDef.type === "component"
			? propsDef.sections.concat([
					{
						title: "Styles",
						type: "STYLES",
					},
			  ])
			: propsDef.sections

	return (
		<div className={classes.wrapper}>
			{!!propsDef?.properties?.length && (
				<div className={classes.propList}>
					<PropList
						path={path}
						propsDef={propsDef}
						properties={propsDef.properties}
						context={context}
						valueAPI={valueAPI}
					/>
				</div>
			)}
			{sections.map((section, index) => (
				<BuildSection
					key={index}
					path={path}
					propsDef={propsDef}
					section={section}
					index={index}
					context={context}
					valueAPI={valueAPI}
				/>
			))}
		</div>
	)
}

export default BuildPropArea
