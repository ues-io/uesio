package cmd

import (
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/uesio/pkg/bundlestore/localbundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func init() {

	rootCmd.AddCommand(&cobra.Command{
		Use:   "pack",
		Short: "clio pack",
		Run:   packer,
	})

}

var globalsMap = map[string]string{
	"react":        "React",
	"react-dom":    "ReactDOM",
	"@uesio/ui":    "uesio",
	"yaml":         "yaml",
	"@emotion/css": "emotion",
}

var globalsList = []string{"react", "react-dom", "@uesio/ui", "yaml", "@emotion/css"}

var globalsPlugin = api.Plugin{
	Name: "env",
	Setup: func(build api.PluginBuild) {
		// Intercept import paths called "env" so esbuild doesn't attempt
		// to map them to a file system location. Tag them with the "env-ns"
		// namespace to reserve them for this plugin.
		build.OnResolve(api.OnResolveOptions{Filter: "^(" + strings.Join(globalsList, "|") + ")$"},
			func(args api.OnResolveArgs) (api.OnResolveResult, error) {
				return api.OnResolveResult{
					Path:      args.Path,
					Namespace: "globals",
				}, nil
			})

		// Load paths tagged with the "env-ns" namespace and behave as if
		// they point to a JSON file containing the environment variables.
		build.OnLoad(api.OnLoadOptions{Filter: `.*`, Namespace: "globals"},
			func(args api.OnLoadArgs) (api.OnLoadResult, error) {
				match, ok := globalsMap[args.Path]
				if !ok {
					return api.OnLoadResult{}, errors.New("Invalid Import")
				}
				contents := "module.exports = " + match
				return api.OnLoadResult{
					Contents: &contents,
				}, nil
			})
	},
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func pack() error {

	sbs := &localbundlestore.LocalBundleStore{}

	def, err := sbs.GetBundleDef("", "", nil, nil)
	if err != nil {
		return err
	}

	// Create a fake session
	namespace := def.Name

	packs := &meta.ComponentPackCollection{}

	err = sbs.GetAllItems(packs, "", "", nil, nil)
	if err != nil {
		return err
	}

	entryPoints := []string{}

	// Create the entry files
	for _, pack := range *packs {
		runtimeImports := []string{"import { component } from \"@uesio/ui\";"}
		runtimeRegistrations := []string{}
		builderImports := []string{"import { component } from \"@uesio/ui\";"}
		builderDefImports := []string{}
		builderRegistrations := []string{}
		// Loop over the components
		for key := range pack.Components.ViewComponents {
			hasDefinition := fileExists(fmt.Sprintf("bundle/components/view/%[1]s/%[1]s.tsx", key))
			if hasDefinition {
				runtimeImports = append(runtimeImports, fmt.Sprintf("import %[1]s from \"../../components/view/%[1]s/%[1]s\";", key))
				hasSignals := fileExists(fmt.Sprintf("bundle/components/view/%[1]s/signals.ts", key))
				hasBuilder := fileExists(fmt.Sprintf("bundle/components/view/%[1]s/%[1]sbuilder.tsx", key))
				hasDef := fileExists(fmt.Sprintf("bundle/components/view/%[1]s/%[1]sdefinition.ts", key))
				if hasSignals {
					runtimeImports = append(runtimeImports, fmt.Sprintf("import %[1]ssignals from \"../../components/view/%[1]s/signals\";", key))
					runtimeRegistrations = append(runtimeRegistrations, fmt.Sprintf("component.registry.register(\"%[2]s.%[1]s\",%[1]s,%[1]ssignals);", key, namespace))
				} else {
					runtimeRegistrations = append(runtimeRegistrations, fmt.Sprintf("component.registry.register(\"%[2]s.%[1]s\",%[1]s);", key, namespace))
				}
				builderName := fmt.Sprintf("%[1]sbuilder", key)
				definitionName := fmt.Sprintf("%[1]sdefinition", key)
				if hasBuilder {
					builderImports = append(builderImports, fmt.Sprintf("import %[2]s from \"../../components/view/%[1]s/%[2]s\";", key, builderName))
				}
				if hasDef {
					builderDefImports = append(builderDefImports, fmt.Sprintf("import %[2]s from \"../../components/view/%[1]s/%[2]s\";", key, definitionName))
				}
				if hasBuilder || hasDef {
					builderValue := "undefined"
					if hasBuilder {
						builderValue = builderName
					}
					defValue := "undefined"
					if hasDef {
						defValue = definitionName
					}
					builderRegistrations = append(builderRegistrations, fmt.Sprintf("component.registry.registerBuilder(\"%[2]s.%[1]s\",%[3]s,%[4]s);", key, namespace, builderValue, defValue))
				}
			}
		}

		for key := range pack.Components.UtilityComponents {
			hasDefinition := fileExists(fmt.Sprintf("bundle/components/utility/%[1]s/%[1]s.tsx", key))
			if hasDefinition {
				runtimeImports = append(runtimeImports, fmt.Sprintf("import %[1]s_utility from \"../../components/utility/%[1]s/%[1]s\";", key))
				runtimeRegistrations = append(runtimeRegistrations, fmt.Sprintf("component.registry.registerUtilityComponent(\"%[2]s.%[1]s\",%[1]s_utility)", key, namespace))
			}
		}

		runtimeEntry := strings.Join(append(runtimeImports, runtimeRegistrations...), "\n")
		builderEntry := strings.Join(append(builderImports, append(builderDefImports, builderRegistrations...)...), "\n")

		runtimeFileName := fmt.Sprintf("bundle/componentpacks/%[1]s/runtime.ts", pack.Name)
		builderFileName := fmt.Sprintf("bundle/componentpacks/%[1]s/builder.ts", pack.Name)
		err := os.WriteFile(runtimeFileName, []byte(runtimeEntry), 0777)
		if err != nil {
			return err
		}

		err = os.WriteFile(builderFileName, []byte(builderEntry), 0777)
		if err != nil {
			return err
		}

		entryPoints = append(entryPoints, runtimeFileName, builderFileName)

	}

	start := time.Now()

	// Then pack with esbuild
	result := api.Build(api.BuildOptions{
		EntryPoints:       entryPoints,
		Bundle:            true,
		Outdir:            "bundle/componentpacks",
		Outbase:           "bundle/componentpacks",
		AllowOverwrite:    true,
		External:          globalsList,
		Write:             true,
		Plugins:           []api.Plugin{globalsPlugin},
		MinifyWhitespace:  true,
		MinifyIdentifiers: true,
		MinifySyntax:      true,
	})
	if result.Errors != nil {
		fmt.Println(result.Errors)
	}
	fmt.Println(fmt.Sprintf("Done Packing: %v", time.Since(start)))
	return nil
}

func packer(cmd *cobra.Command, args []string) {
	err := pack()
	if err != nil {
		fmt.Println("Error: " + err.Error())
		return
	}
}
