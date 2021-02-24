import { getURLFromFullName } from "../hooks/fileapi"
import {
	Theme,
	colors,
	Color,
	createStyles,
	makeStyles,
	useTheme,
} from "@material-ui/core"
import {
	CreateCSSProperties,
	CSSProperties,
} from "@material-ui/core/styles/withStyles"
import { Context } from "../context/context"
import { PaletteColor } from "@material-ui/core/styles/createPalette"

type ThemeIntention =
	| "primary"
	| "secondary"
	| "error"
	| "warning"
	| "info"
	| "success"
type ThemeHue = keyof typeof colors
type ThemeShade = keyof Color

type BackgroundDefinition =
	| {
			image?: string
			color?: ColorDefinition
	  }
	| undefined

type MarginDefinition = number[] | undefined

type FloatDefinition = "left" | "right" | undefined

type ColorDefinition =
	| string
	| undefined
	| {
			value?: string
			intention?: ThemeIntention
			key?: keyof PaletteColor
			hue?: ThemeHue
			shade?: ThemeShade
	  }

function useStyleProperty<T>(property: T | undefined, defaultValue: T): T {
	return property !== undefined ? property : defaultValue
}

const getBackgroundImage = (
	definition: BackgroundDefinition,
	theme: Theme,
	context: Context
): string | undefined => {
	const image = definition?.image
	return image ? `url("${getURLFromFullName(context, image)}")` : undefined
}

const getBackgroundStyles = (
	definition: BackgroundDefinition,
	theme: Theme,
	context: Context
): CreateCSSProperties => ({
	backgroundColor: getColor(definition?.color, theme, context),
	backgroundImage: getBackgroundImage(definition, theme, context),
	backgroundSize: "cover",
})

const getMarginStyles = (
	definition: MarginDefinition,
	theme: Theme
): CreateCSSProperties => {
	if (!definition) {
		return {}
	}
	if (Array.isArray(definition)) {
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
const getColor = (
	definition: ColorDefinition,
	theme: Theme,
	context: Context
): undefined | string => {
	if (!definition) return undefined
	let result = ""
	if (typeof definition === "string") {
		result = context.merge(definition)
	} else if (definition.value) {
		result = context.merge(definition.value)
	} else if (definition.intention) {
		const intention = theme.palette?.[definition.intention]
		result = intention[definition.key || "main"]
	} else if (definition.hue) {
		const hue = colors?.[definition.hue] as Color
		result = hue[definition.shade || 500]
	}
	if (result && isValidColor(result)) return result
}
// https://stackoverflow.com/questions/48484767/javascript-check-if-string-is-valid-css-color
function isValidColor(potientialColor: string): boolean {
	const style = new Option().style
	style.color = potientialColor
	return !!style.color
}
interface styledDefinition {
	definition: {
		"uesio.styles"?: Record<string, Record<string, unknown>>
	}
}

function getUseStyles<T extends styledDefinition>(
	classNames: string[],
	defaultStyling?: Record<
		string,
		((props: T, theme: Theme) => CSSProperties) | CSSProperties
	>
) {
	return makeStyles((theme) => {
		const createStyleArgs: Record<string, (props: T) => CSSProperties> = {}
		classNames.forEach((className) => {
			createStyleArgs[className] = (props: T): CSSProperties => {
				const defaultValuesFromStyles = defaultStyling?.[className]
				let defaultValues: CSSProperties = {}
				if (typeof defaultValuesFromStyles === "function") {
					defaultValues = defaultValuesFromStyles(props, theme)
				} else if (defaultValuesFromStyles) {
					defaultValues = defaultValuesFromStyles
				}
				const customExtensions =
					props.definition?.["uesio.styles"]?.[className] || {}
				return { ...defaultValues, ...customExtensions }
			}
		})
		// Getting the type signature right here was super hard so I gave up.
		// Could be improved.

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return createStyles(createStyleArgs)
	})
}
export {
	useTheme,
	useStyleProperty,
	getBackgroundStyles,
	getMarginStyles,
	getFloatStyles,
	BackgroundDefinition,
	MarginDefinition,
	FloatDefinition,
	CSSProperties,
	CreateCSSProperties,
	Theme,
	getUseStyles,
	getColor,
}
