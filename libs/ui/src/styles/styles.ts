import { getURLFromFullName } from "../hooks/fileapi"
import { Theme } from "@material-ui/core"
import { CreateCSSProperties } from "@material-ui/core/styles/withStyles"
import { Context } from "../context/context"

import { CSSProperties } from "@material-ui/styles"

type BackgroundDefinition =
	| {
			image: string
			color: string
	  }
	| undefined

type MarginDefinition = number[] | undefined

type FloatDefinition = "left" | "right" | undefined

function useStyleProperty<T>(property: T | undefined, defaultValue: T): T {
	return property !== undefined ? property : defaultValue
}

const getBackgroundImage = (
	definition: BackgroundDefinition,
	context: Context
): string | undefined => {
	const image = definition?.image
	return image ? `url("${getURLFromFullName(context, image)}")` : undefined
}

const getBackgroundStyles = (
	definition: BackgroundDefinition,
	context: Context
): CreateCSSProperties => {
	const color =
		definition?.color && context
			? context.merge(definition?.color)
			: definition?.color
	return {
		backgroundColor: color,
		backgroundImage: getBackgroundImage(definition, context),
		backgroundSize: "cover",
	}
}

const getMarginStyles = (
	definition: MarginDefinition,
	theme: Theme
): CreateCSSProperties => {
	if (!definition) {
		return {}
	}
	if (definition instanceof Array) {
		return {
			margin: theme.spacing(
				...(definition as [number, number, number, number])
			),
		}
	}
	return {
		margin: theme.spacing(definition),
	}
}

const getFloatStyles = (definition: FloatDefinition): CreateCSSProperties =>
	!definition
		? {}
		: {
				float: definition,
		  }

export {
	useStyleProperty,
	getBackgroundStyles,
	getMarginStyles,
	getFloatStyles,
	BackgroundDefinition,
	MarginDefinition,
	FloatDefinition,
	CSSProperties,
}
