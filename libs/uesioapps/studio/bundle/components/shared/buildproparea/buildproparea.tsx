import { FunctionComponent } from "react"

import { definition, builder, styles } from "@uesio/ui"
import BuildSection from "./buildsection"
import PropList from "./proplist"

interface Props extends definition.BaseProps {
	propsDef: builder.BuildPropertiesDefinition
	setValue: (path: string, value: definition.DefinitionValue) => void
	getValue: (path: string) => definition.Definition
}

const BuildPropArea: FunctionComponent<Props> = (props) => {
	const { propsDef, path, context, getValue, setValue } = props
	const classes = styles.useStyles(
		{
			wrapper: {
				overflow: "auto",
				flex: 1,
			},
			propList: {
				padding: "10px 6px 0 6px",
				borderBottom: "1px solid #ccc",
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
						getValue={getValue}
						setValue={setValue}
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
					getValue={getValue}
					setValue={setValue}
				/>
			))}
		</div>
	)
}

export default BuildPropArea
