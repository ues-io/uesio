import React, { FunctionComponent } from "react"
import { makeStyles, createStyles } from "@material-ui/core"
import { definition, builder } from "@uesio/ui"
import BuildSection from "./buildsection"
import PropList from "./proplist"

interface Props extends definition.BaseProps {
	buildPropsDef: builder.BuildPropertiesDefinition
}

const useStyles = makeStyles(() =>
	createStyles({
		wrapper: {
			overflow: "auto",
			flex: 1,
		},
		propList: {
			padding: "10px 6px 0px 6px",
			borderBottom: "1px solid #ccc",
		},
	})
)

const BuildPropArea: FunctionComponent<Props> = ({
	buildPropsDef,
	path,
	definition,
	context,
}) => {
	const classes = useStyles()
	return (
		<div className={classes.wrapper}>
			{buildPropsDef?.properties && (
				<div className={classes.propList}>
					<PropList
						path={path}
						definition={definition}
						properties={buildPropsDef.properties}
						context={context}
					/>
				</div>
			)}
			{buildPropsDef.sections.map((section, index) => (
				<BuildSection
					key={index}
					path={path}
					definition={definition}
					section={section}
					index={index}
					context={context}
				/>
			))}
		</div>
	)
}

export default BuildPropArea
