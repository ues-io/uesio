import { FunctionComponent } from "react"

import { definition, builder, styles } from "@uesio/ui"
import BuildSection from "./buildsection"
import PropList from "./proplist"

interface Props extends definition.BaseProps {
	propsDef: builder.BuildPropertiesDefinition
	valueAPI: builder.ValueAPI
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
				padding: "10px 8px 0 8px",
				position: "relative",
				borderBottom: "1px solid #eee",
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
