import { PaletteValue, ThemeState } from "../definition/theme"
import { BaseProps, UtilityProps } from "../definition/definition"

import * as colors from "./colors"
import { getVariantDefinition } from "../component/component"
import { MetadataKey } from "../metadataexports"
import { extendTailwindMerge } from "tailwind-merge"
import { Context } from "../context/context"
import {
  Class,
  css,
  getSheet,
  hash,
  Preset,
  ThemeFunction,
  Twind,
  twind,
} from "@twind/core"
import { STYLE_TOKENS, STYLE_VARIANT } from "../componentexports"
import interpolate from "./interpolate"
import presetAutoprefix from "@twind/preset-autoprefix"
import presetTailwind from "@twind/preset-tailwind"
import { isStandardColorName } from "./colors"
import { parseKey } from "../component/path"
import { getComponentType } from "../hooks/componentapi"

const processThemeColor = (
  themeFunc: ThemeFunction,
  key: string,
  value: PaletteValue,
) => {
  // If we're one of the color values
  if (isStandardColorName(value)) {
    return [
      key,
      {
        ...(themeFunc("colors." + value) as unknown as object),
        DEFAULT: themeFunc("colors." + value + ".600"),
      },
    ]
  }
  const valueParts = value.split("-")
  // If we're a color value plus shade
  if (valueParts.length === 2) {
    const hue = valueParts[0]
    const shade = valueParts[1]
    return [key, themeFunc("colors." + hue + "." + shade)]
  }

  return [key, value]
}

const processThemeColors = (
  themeFunc: ThemeFunction,
  themeData: ThemeState,
) => {
  const palette = themeData.definition?.palette
  return palette
    ? Object.fromEntries(
        Object.entries(palette).map(([key, value]) =>
          processThemeColor(themeFunc, key, value),
        ),
      )
    : {}
}

// This converts all our @media queries to @container queries
const presetContainerQueries = (): Preset => ({
  finalize: (rule) => {
    if (rule.r && rule.r.length > 0 && rule.r[0].startsWith("@media")) {
      rule.r[0] = rule.r[0].replace("@media", "@container")
    }
    return rule
  },
})

// this adds a @scope prefix to any rule that needs a scope.
// (Used for themes-within-themes)
const presetAddThemeScope = (scope: string): Preset => {
  const scopeRule = `@scope (.${scope}) to (:scope .uesio-theme)`
  return {
    finalize: (rule) => {
      if (scope) {
        rule.r.unshift(scopeRule)
      }
      return rule
    },
  }
}

type StyleEntryCache = {
  twind: Twind
  theme: string
}

const DEFAULT_THEME_DATA = {
  namespace: "uesio/core" as const,
  name: "notheme",
}

const getClosestThemeRoot = (element: Element | null) => {
  const themeRoot = element?.closest<HTMLElement>(".uesio-theme") || undefined
  return themeRoot
}

const getTheme = (context: Context): ThemeState =>
  context.getTheme() || DEFAULT_THEME_DATA

// stylesCache stores a map of themeKey to Twind instance.
const stylesCache: Record<string, StyleEntryCache | undefined> = {}

let twMerge: ReturnType<typeof extendTailwindMerge>

const getThemeKey = (themeData: ThemeState) =>
  `${themeData.namespace}.${themeData.name}`

const getThemeCacheKey = (themeData: ThemeState) =>
  themeData.isScoped ? getThemeKey(themeData) : ""

const getThemeClass = (context: Context) => {
  const themeData = getTheme(context)
  const themeKey = getThemeKey(themeData)
  return "uesio-theme " + generateThemeClass(themeKey)
}

const generateThemeClass = (themeKey: string) =>
  themeKey.replace("/", "_").replace(".", "_")

const getActiveStyles = (context: Context) => {
  const themeData = getTheme(context)
  const themeCacheKey = getThemeCacheKey(themeData)
  return stylesCache[themeCacheKey]
}

const setupStyles = (context: Context) => {
  const themeData = getTheme(context)
  const themeCacheKey = getThemeCacheKey(themeData)
  const themeKey = getThemeKey(themeData)
  const themeClass = generateThemeClass(themeKey)

  let activeStyles = stylesCache[themeCacheKey]

  if (activeStyles && activeStyles.theme !== themeKey) {
    activeStyles.twind.destroy()
    delete stylesCache[themeCacheKey]
    activeStyles = undefined
  }

  const themeClasses = "uesio-theme " + themeClass

  if (activeStyles) return themeClasses

  const presets = [
    presetAutoprefix(),
    presetTailwind(),
    presetContainerQueries(),
  ]

  if (themeData.isScoped) {
    presets.push(presetAddThemeScope(themeClass))
  }

  const stylesInstance = twind(
    {
      presets,
      hash: false,
      theme: {
        extend: {
          colors: ({ theme }) => processThemeColors(theme, themeData),
          fontFamily: {
            sans: ["Roboto", "sans-serif"],
          },
          fontSize: {
            xxs: ["8pt", "16px"],
          },
        },
      },
    },
    getSheet(),
  )
  stylesCache[themeCacheKey] = {
    twind: stylesInstance,
    theme: themeKey,
  }

  twMerge = extendTailwindMerge({
    extend: {
      classGroups: {
        "font-size": ["xxs"],
      },
    },
  })

  stylesInstance(
    css({
      "@layer base": {
        html: {
          "container-type": "inline-size",
        },
      },
    }),
  )

  // We need to process the style classes we put on the root element in index.gohtml
  process(context, "h-screen overflow-auto hidden contents")

  return themeClasses
}

function useStyleTokens<K extends string>(
  defaults: Record<K, Class[]>,
  props: BaseProps,
) {
  const { definition, context, componentType } = props
  const variantTokens = getVariantTokens(
    componentType,
    definition?.[STYLE_VARIANT],
    context,
  )
  const inlineTokens = definition?.[STYLE_TOKENS] || {}
  return Object.entries(defaults).reduce(
    (classNames, entry: [K, Class[]]) => {
      const [className, defaultClasses] = entry
      classNames[className] = process(
        context,
        defaultClasses,
        variantTokens?.[className],
        inlineTokens[className],
      )
      return classNames
    },
    {} as Record<K, string>,
  )
}

function getVariantTokens(
  componentType: MetadataKey | undefined,
  variantKey: MetadataKey | undefined,
  context: Context,
) {
  const variantDefinition = getVariantDefinition(
    componentType,
    componentType ? getComponentType(componentType) : undefined,
    variantKey,
    context,
  )
  if (!variantDefinition) return {}
  return variantDefinition?.[STYLE_TOKENS] as Record<string, string[]>
}

function process(context: Context, ...classes: Class[]) {
  const output = interpolate(classes, [])
  const activeStyles = getActiveStyles(context)
  if (!activeStyles) return ""
  return activeStyles.twind(
    twMerge(context ? context?.mergeString(output) : output),
  )
}

function add(context: Context, value: Parameters<typeof css>[0]) {
  const activeStyles = getActiveStyles(context)
  if (!activeStyles) return ""
  activeStyles.twind(css(value))
}

// This is a slight hack, but necessary for the moment.
// There is an assumption that utility components without
// a variant specified should use a variant called "default"
// in the namespace of the associated defaultVariantComponentType.
// See:
//   https://github.com/ues-io/uesio/issues/4632
//   https://github.com/ues-io/uesio/issues/4433
function getDefaultVariant(
  defaultVariantComponentType?: MetadataKey,
): MetadataKey | undefined {
  if (!defaultVariantComponentType) return undefined

  const [namespace] = parseKey(defaultVariantComponentType)
  return `${namespace}.default`
}

function useUtilityStyleTokens<K extends string>(
  defaults: Record<K, Class[]>,
  props: UtilityProps,
  defaultVariantComponentType?: MetadataKey,
) {
  const variantTokens = getVariantTokens(
    defaultVariantComponentType,
    // TODO: Eliminate call to getDefaultVariant when https://github.com/ues-io/uesio/issues/4632 is addressed
    props.variant || getDefaultVariant(defaultVariantComponentType),
    props.context,
  )
  const inlineTokens = props.styleTokens

  return Object.entries(defaults).reduce(
    (classNames, entry: [K, Class[]]) => {
      const [className, defaultClasses] = entry
      classNames[className] = process(
        props.context,
        defaultClasses,
        variantTokens?.[className],
        props.classes?.[className],
        // A bit weird here... Only apply the passed-in className prop to root styles.
        // Otherwise, it would be applied to every class sent in as defaults.
        className === "root" && props.className,
        inlineTokens?.[className],
      )
      return classNames
    },
    {} as Record<K, string>,
  )
}

function getThemeValue(context: Context, key: string) {
  const activeStyles = getActiveStyles(context)
  return activeStyles?.twind.theme(key) || ""
}

function cx(...input: Class[]): string {
  return twMerge?.(interpolate(input)) || ""
}

function shortcut(context: Context, name: string, ...input: Class[]): string {
  const activeStyles = getActiveStyles(context)
  if (!activeStyles) return ""
  return activeStyles.twind(name + "~(" + interpolate(input) + ")")
}

export type { ThemeState }

export {
  cx,
  add,
  shortcut,
  process,
  setupStyles,
  useUtilityStyleTokens,
  useStyleTokens,
  getVariantTokens,
  getClosestThemeRoot,
  getThemeValue,
  getThemeClass,
  colors,
  hash,
}
