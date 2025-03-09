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
		"react-dom/server": "ReactDOMServer",
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
			Define: map[string]string{"define.amd": "undefined"}, // TODO: Test/evaluate if this is still required
		}

		basePath := fmt.Sprintf("bundle/componentpacks/%s/", packName)
		metaFilePath := fmt.Sprintf("%sdist/meta.json", basePath)

		err := Build(buildOptions, metaFilePath, options.Watch)
		if err != nil {
			return err
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
		for _, err := range result.Errors {
			fmt.Println(err)
			fmt.Println(err.Location)
		}
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
