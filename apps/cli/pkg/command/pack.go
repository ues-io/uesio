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
		"react-dom/server": "ReactDOM",
		"react-dom/client": "ReactDOM",
		// We're adding "react/jsx-runtime" here as a global
		// because we were running into issues with the
		// react-hotkeys-hook library adding a module import for
		// "react/jsx-runtime". I'm not sure exactly what the global
		// value for "react/jsx-runtime" should be, but setting it
		// to React seems to fix the issue.
		"react/jsx-runtime": "jsxRuntime",
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
			Define: map[string]string{"define.amd": "undefined"},
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
