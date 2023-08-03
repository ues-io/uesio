package command

import (
	"fmt"
	"io/ioutil"
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
			MinifyWhitespace:  true,
			MinifyIdentifiers: true,
			MinifySyntax:      true,
			Metafile:          true,
			Sourcemap:         api.SourceMapLinked,
		}

		if options.Watch {
			pack.ModifyWatchOptions(buildOptions)
		}
		// Then pack with esbuild
		result := api.Build(*buildOptions)
		if result.Errors != nil {
			pack.HandleBuildErrors(result.Errors)
		}

		baseURL := fmt.Sprintf("bundle/componentpacks/%s/", packName)
		metaURL := fmt.Sprintf("%sdist/meta.json", baseURL)

		ioutil.WriteFile(metaURL, []byte(result.Metafile), 0644)

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
