package command

import (
	"fmt"
	"os"
	"time"

	"github.com/evanw/esbuild/pkg/api"

	"github.com/thecloudmasters/cli/pkg/pack"
)

type PackOptions struct {
	Zip   bool
	Watch bool
}

func Pack(options *PackOptions) error {

	if options == nil {
		options = &PackOptions{}
	}

	start := time.Now()

	globalsMap := map[string]string{
		"react":            "React",
		"react-dom":        "ReactDOM",
		"@uesio/ui":        "uesio",
		"react-dom/client": "ReactDOMClient",
		// We're adding "react/jsx-runtime" here as a global for two reasons:
		//    1. react-hotkeys-hook library has a module import for it
		//    2. floating-ui/react library has a module import for it and uses jsxs
		// TODO: It's possible that we may be able to avoid this global and configure build to
		// resolve react/jsx-runtime.  The underlying issue relates to the fact that react/jsx-runtime
		// paths are hardcoded in React and not exposed as an export.  See:
		//    https://github.com/evanw/esbuild/issues/2704
		//    https://github.com/evanw/esbuild/issues/2704#issuecomment-1329325044
		//    https://github.com/evanw/esbuild/issues/2791
		"react/jsx-runtime": "ReactJsxRuntime",
	}

	entryPoints, err := pack.CreateEntryFiles()
	if err != nil {
		return err
	}

	// If there are no component packs in the bundle, there's nothing to do,
	// since there's no custom JS to compile with ESBuild
	if len(entryPoints) == 0 {
		return nil
	}

	for packName, entryPoint := range entryPoints {

		buildOptions := &api.BuildOptions{
			EntryPoints:       []string{entryPoint},
			Bundle:            true,
			Format:            api.FormatESModule,
			Outdir:            "bundle/componentpacks",
			Outbase:           "bundle/componentpacks",
			AllowOverwrite:    true,
			External:          pack.GetGlobalsList(globalsMap),
			Write:             true,
			Plugins:           []api.Plugin{pack.GetGlobalsPlugin(globalsMap)},
			TsconfigRaw:       "{}",
			MinifyWhitespace:  true,
			MinifyIdentifiers: true,
			MinifySyntax:      true,
			Metafile:          true,
			Sourcemap:         api.SourceMapLinked,
			// This fixes a bug where the monaco amd loader was polluting
			// the global define object, causing papaparse to not load correctly.

			// We load monaco-editor via its AMD loader since there is not a stock bundling
			// solution for monaco-editor esm via esbuild (see https://github.com/microsoft/monaco-editor/issues/4614).
			// The use of the AMD loader results in polluting the global define object with define.amd which then causes
			// issues when loading dependencies (e.g., papaparse, ajv, fuzzysort) that do not natively
			// support ESM (they have UMD wrapper which results in define.amd being detected and AMD
			// loads being attempted).  To reproduce the issue:
			//    1. Open a view in "builder" mode directly (if you navigate to the "build" page, ensure you do a hard refresh)
			//    2. Go to a collection->Manage Data->Import Data
			// This will fail to load papaparse because define.amd is defined and papaparse has UMD wrapper and will
			// attempt to use AMD loader.  This failure is VERY specific to the order that things load
			// so if you simply view a "View" in studio, then go to collections->manage data->import data, the problem will
			// not occur.  This is because studio bundle which uses papaparse will load because io bundle which loads
			// monaco-editor so define.amd is not defined yet.  In the "builder" for a view, "io" bundle is loaded first
			// then when going to import data, studio is loaded but define.amd is defined at that point.
			//
			// The solution is to avoid using dependencies that do not fully support ESM but that isn't really possible.
			// The alternate solution is to load monaco-editor via ESM but esbuild bundling monaco-editor is extremely
			// fragile.  There is working POC of this at https://github.com/ues-io/uesio/tree/chore/migrate-monaco-editor-to-esm
			// but its a WIP and has several limitations/issues (see https://github.com/ues-io/uesio/blob/chore/migrate-monaco-editor-to-esm/libs/ui/build.ts#L6).
			//
			// For now, we use Define below to ensure that define.amd is always undefined within our bundles
			// TODO: If/When monaco-editor better supports ESM and/or a reliable plugin for esbuild is made, this can
			// be removed and monaco-editor loaded via ESM implemented (see https://github.com/microsoft/monaco-editor/issues/4614)
			Define: map[string]string{"define.amd": "undefined"},
		}

		basePath := fmt.Sprintf("bundle/componentpacks/%s/", packName)
		metaFilePath := fmt.Sprintf("%sdist/meta.json", basePath)

		fmt.Printf("Packing %s...\n", packName)
		err := Build(buildOptions, metaFilePath, options.Watch)
		if err != nil {
			return fmt.Errorf("Packing %s failed: %w", packName, err)
		}

		fmt.Println(fmt.Sprintf("Done Packing %s: %v", packName, time.Since(start)))
	}

	fmt.Println(fmt.Sprintf("Done Packing All: %v", time.Since(start)))

	// Returning from pack() exits immediately in Go.
	// Block forever so that we keep watching and don't exit.
	if options.Watch {
		fmt.Println("Watching for changes... (Ctrl-C to exit)")
		<-make(chan bool)
	}
	return nil
}

func Build(options *api.BuildOptions, metaFilePath string, watch bool) error {
	if watch {
		return Watch(options)
	}
	result := api.Build(*options)
	if result.Errors != nil {
		return fmt.Errorf("Build error(s): %v", result.Errors)
	}
	if result.Warnings != nil {
		fmt.Printf("Build warning(s): %v\n", result.Warnings)
	}

	if metaFilePath == "" {
		return nil
	}

	return os.WriteFile(metaFilePath, []byte(result.Metafile), 0644)

}

func Watch(options *api.BuildOptions) error {

	options.Define = map[string]string{"process.env.NODE_ENV": `"development"`}
	options.MinifyWhitespace = false
	options.MinifyIdentifiers = false
	options.MinifySyntax = false
	options.LogLevel = api.LogLevelDebug

	ctx, err := api.Context(*options)
	if err != nil {
		return err
	}

	return ctx.Watch(api.WatchOptions{})
}
