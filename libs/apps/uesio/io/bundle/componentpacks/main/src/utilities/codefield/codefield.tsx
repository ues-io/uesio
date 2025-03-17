import { component, definition, styles, api, context, util } from "@uesio/ui"
import Editor, { loader, Monaco } from "@monaco-editor/react"
import type monaco from "monaco-editor"
import { CodeFieldUtilityProps } from "./types"
import { useEffect, useMemo, useState } from "react"
import { useDeepCompareEffect } from "react-use"
import debounce from "lodash/debounce"
const { ErrorMessage } = component

const monacoEditorVersion = api.platform.getMonacoEditorVersion()
const staticAssetsHost = api.platform.getStaticAssetsHost()
const { getFileText } = api.platform

loader.config({
  paths: {
    vs: `${staticAssetsHost}/static/vendor/monaco-editor/${monacoEditorVersion}`,
  },
})

const preprocessTypeFileURIs = (
  uris: string[] | undefined,
  context: context.Context,
) => {
  if (uris === undefined) return []
  return uris.map((uri) => context.mergeString(uri))
}

const StyleDefaults = Object.freeze({
  input: [],
  readonly: [],
  loading: [],
})

const DEFAULT_DEBOUNCE_INTERVAL = 100

const CodeField: definition.UtilityComponent<CodeFieldUtilityProps> = (
  props,
) => {
  const {
    setValue,
    value,
    language = "typescript",
    options,
    onMount,
    beforeMount,
    context,
    theme,
    mode,
  } = props
  const debounceInterval = props.debounce || DEFAULT_DEBOUNCE_INTERVAL
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState("")
  const typeDefinitionFileURIs = preprocessTypeFileURIs(
    props.typeDefinitionFileURIs,
    context,
  )
  const classes = styles.useUtilityStyleTokens(
    StyleDefaults,
    props,
    "uesio/io.codefield",
  )
  const mergedLanguage = context.mergeString(language).toLowerCase()

  const [loadedModels, setLoadedModels] = useState({} as Record<string, string>)

  const debouncedSetValue = useMemo(
    () => setValue && debounce(setValue, debounceInterval),
    [debounceInterval, setValue],
  )

  useEffect(
    () => () => {
      debouncedSetValue?.cancel()
    },
    [debouncedSetValue],
  )

  useDeepCompareEffect(() => {
    ;(async () => {
      try {
        const newModels = {} as Record<string, string>
        await Promise.all(
          typeDefinitionFileURIs
            .filter((uri) => !!uri)
            .map((uri) =>
              getFileText(uri).then((data) => {
                newModels[uri] = data
                return data
              }),
            ),
        )
        setLoadedModels(newModels)
      } catch (error) {
        setLoadingError(util.getErrorString(error))
      } finally {
        setLoading(false)
      }
    })()
    return
  }, [typeDefinitionFileURIs])

  function handleEditorWillMount(monaco: Monaco) {
    const loadedTypeModelUris = Object.keys(loadedModels)
    if (loadedTypeModelUris.length > 0) {
      // Synchronize our current models with the new models.
      const existingModels = monaco.editor.getModels()
      const existingModelsById = {} as Record<string, monaco.editor.ITextModel>
      existingModels.forEach((model) => {
        existingModelsById[model.uri.toString()] = model
      })
      loadedTypeModelUris.forEach((uri) => {
        const monacoUri = monaco.Uri.parse(uri)
        const id = monacoUri.toString()
        const model = existingModelsById[id]
        const modelContents = loadedModels[uri]
        // If we don't have this Model yet, create it
        if (!model) {
          monaco.editor.createModel(modelContents, mergedLanguage, monacoUri)
        } else {
          // If we DO have this model already, replace its contents, if changed
          const currentValue = model.getValue()
          if (currentValue !== modelContents) {
            model.setValue(modelContents)
          }
          delete existingModelsById[id]
        }
      })
      // Remove any other models
      Object.values(existingModelsById).forEach((model) => {
        model.dispose()
      })
    }
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true)

    beforeMount?.(monaco)
  }

  function handleEditorDidMount(
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) {
    onMount?.(editor, monaco)
  }

  const loadingNode = (
    <div className={classes.loading}>
      Loading language models for {mergedLanguage}...
    </div>
  )

  if (loading) {
    return loadingNode
  }

  if (!loading && loadingError) {
    return (
      <ErrorMessage
        title="Code editor"
        error={
          new Error(
            `Failed to load language models for code editor, error is: ${loadingError}`,
          )
        }
      />
    )
  }

  return (
    <div className={classes.input}>
      <Editor
        value={value}
        loading={loadingNode}
        options={{
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly: mode === "READ",
          minimap: {
            enabled: false,
          },
          ...options,
        }}
        theme={theme}
        language={mergedLanguage}
        onChange={debouncedSetValue}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
      />
    </div>
  )
}

export default CodeField
