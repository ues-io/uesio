import { PaletteValue, ThemeState } from "../definition/theme"
import { UtilityProps } from "../definition/definition"

import * as colors from "./colors"
import {
  getDefinitionFromVariant,
  parseVariantName,
} from "../component/component"
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
import { STYLE_TOKENS } from "../componentexports"
import interpolate from "./interpolate"
import presetAutoprefix from "@twind/preset-autoprefix"
import presetTailwind from "@twind/preset-tailwind"
import { isStandardColorName } from "./colors"

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
  scoped: boolean
  theme: string
}

// stylesCache stores a map of themeKey to Twind instance.
const stylesCache: Record<string, StyleEntryCache | undefined> = {}

let twMerge: ReturnType<typeof extendTailwindMerge>

const getThemeKey = (themeData: ThemeState) =>
  `${themeData.namespace}.${themeData.name}`

const getThemeCacheKey = (themeData: ThemeState) =>
  themeData.isScoped ? getThemeKey(themeData) : ""

const getThemeClass = (context: Context) => {
  const themeData = context.getTheme()
  if (!themeData) return ""
  const themeKey = getThemeKey(themeData)
  return "uesio-theme " + generateThemeClass(themeKey)
}

const generateThemeClass = (themeKey: string) =>
  themeKey.replace("/", "_").replace(".", "_")

const getActiveStyles = (context: Context) => {
  const themeData = context.getTheme()
  if (!themeData) return undefined
  const themeCacheKey = getThemeCacheKey(themeData)
  return stylesCache[themeCacheKey]
}

const setupStyles = (context: Context) => {
  const themeData = context.getTheme()
  if (!themeData) return ""
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
    scoped: themeData.isScoped,
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
        [".uesio-theme"]: {
          display: "contents",
        },
      },
    }),
  )

  // We need to process the style classes we put on the root element in index.gohtml
  process(context, "h-screen overflow-auto hidden contents")

  return themeClasses
}

export interface StyleDefinition {
  "uesio.styleTokens"?: Record<string, string[]>
}

interface StyleProps {
  context: Context
  definition: StyleDefinition
}

function useStyleTokens<K extends string>(
  defaults: Record<K, Class[]>,
  props: StyleProps,
) {
  const { definition, context } = props
  const inlineTokens = definition?.[STYLE_TOKENS] || {}
  return Object.entries(defaults).reduce(
    (classNames, entry: [K, Class[]]) => {
      const [className, defaultClasses] = entry
      classNames[className] = process(
        context,
        defaultClasses,
        inlineTokens[className],
      )
      return classNames
    },
    {} as Record<K, string>,
  )
}

function getVariantDefinition(
  componentType: MetadataKey | undefined,
  variantKey: MetadataKey | undefined,
  context: Context,
) {
  if (!componentType) return undefined

  const [variantComponentType, variantName] = parseVariantName(
    variantKey,
    componentType,
  )

  if (!variantComponentType || !variantName) return undefined

  const variant = context.getComponentVariant(variantComponentType, variantName)
  if (!variant) return undefined
  return getDefinitionFromVariant(variant, context)
}

function getVariantTokens(
  componentType: MetadataKey | undefined,
  variantKey: MetadataKey | undefined,
  context: Context,
) {
  const variantDefinition = getVariantDefinition(
    componentType,
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

function useUtilityStyleTokens<K extends string>(
  defaults: Record<K, Class[]>,
  props: UtilityProps,
  defaultVariantComponentType?: MetadataKey,
) {
  const variantTokens = getVariantTokens(
    defaultVariantComponentType,
    props.variant,
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

export type { StyleProps, ThemeState }

export {
  cx,
  shortcut,
  process,
  setupStyles,
  useUtilityStyleTokens,
  useStyleTokens,
  getVariantTokens,
  getThemeValue,
  getThemeClass,
  colors,
  hash,
}
