package command

import (
	"compress/gzip"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/thecloudmasters/clio/pkg/pack"
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
		"react":        "React",
		"react-dom":    "ReactDOM",
		"@uesio/ui":    "uesio",
		"@emotion/css": "emotion",
	}

	entryPoints, err := pack.CreateEntryFiles()
	if err != nil {
		return err
	}

	buildOptions := &api.BuildOptions{
		EntryPoints:       entryPoints,
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

	if options.Zip {
		err := zipEntries(entryPoints)
		if err != nil {
			return err
		}
	}

	fmt.Println(fmt.Sprintf("Done Packing: %v", time.Since(start)))

	// Returning from pack() exits immediately in Go.
	// Block forever so we keep watching and don't exit.
	if options.Watch {
		<-make(chan bool)
	}
	return nil
}

func zipEntries(entries []string) error {
	// for each entry point, gzip them
	for _, ep := range entries {
		// Remove the .ts extension and add .js
		fileName := strings.TrimSuffix(ep, filepath.Ext(ep)) + ".js"
		err := gzipFile(fileName)
		if err != nil {
			return err
		}
	}
	return nil
}

func gzipFile(fileName string) error {

	data, err := os.ReadFile(fileName)
	if err != nil {
		return err
	}

	file, err := os.Create(fileName + ".gz")
	if err != nil {
		return err
	}
	defer file.Close()

	zw := gzip.NewWriter(file)
	defer zw.Close()
	_, err = zw.Write(data)
	if err != nil {
		return err
	}
	err = zw.Flush()
	if err != nil {
		return nil
	}

	return nil
}
