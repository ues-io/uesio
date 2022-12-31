package pack

import (
	"fmt"
	"os"
	"strings"

	"github.com/thecloudmasters/clio/pkg/localbundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func CreateEntryFiles() ([]string, error) {
	sbs := &localbundlestore.LocalBundleStore{}

	def, err := sbs.GetBundleDef("", "", nil, nil)
	if err != nil {
		return nil, err
	}

	// Create a fake session
	namespace := def.Name

	packs := &meta.ComponentPackCollection{}

	err = sbs.GetAllItems(packs, "", "", nil, nil)
	if err != nil {
		return nil, err
	}

	entryPoints := []string{}

	// Create the entry files
	for _, pack := range *packs {
		runtimeImports := []string{"import { component } from \"@uesio/ui\";"}
		runtimeRegistrations := []string{}

		if pack.Components == nil {
			fmt.Println("no components listed to pack in bundle.yaml")
			continue
		}

		baseURL := fmt.Sprintf("bundle/componentpacks/%s", pack.Name)
		componentsURL := fmt.Sprintf("%s/src/components", baseURL)
		utilitiesURL := fmt.Sprintf("%s/src/utilities", baseURL)
		// Loop over the components
		for key := range pack.Components.ViewComponents {
			hasDefinition := fileExists(fmt.Sprintf("%[2]s/%[1]s/%[1]s.tsx", key, componentsURL))
			hasSignals := fileExists(fmt.Sprintf("%[2]s/%[1]s/signals.ts", key, componentsURL))
			if hasDefinition {
				runtimeImports = append(runtimeImports, fmt.Sprintf("import %[1]s from \"./src/components/%[1]s/%[1]s\";", key))

				if hasSignals {
					runtimeImports = append(runtimeImports, fmt.Sprintf("import %[1]ssignals from \"./src/components/%[1]s/signals\";", key))
					runtimeRegistrations = append(runtimeRegistrations, fmt.Sprintf("component.registry.register(\"%[2]s.%[1]s\",%[1]s,%[1]ssignals);", key, namespace))
				} else {
					runtimeRegistrations = append(runtimeRegistrations, fmt.Sprintf("component.registry.register(\"%[2]s.%[1]s\",%[1]s);", key, namespace))
				}
			}
		}

		for key := range pack.Components.UtilityComponents {
			hasDefinition := fileExists(fmt.Sprintf("%[2]s/%[1]s/%[1]s.tsx", key, utilitiesURL))
			if hasDefinition {
				runtimeImports = append(runtimeImports, fmt.Sprintf("import %[1]s_utility from \"./src/utilities/%[1]s/%[1]s\";", key))
				runtimeRegistrations = append(runtimeRegistrations, fmt.Sprintf("component.registry.registerUtilityComponent(\"%[2]s.%[1]s\",%[1]s_utility)", key, namespace))
			}
		}

		runtimeEntry := ""
		if len(runtimeRegistrations) > 0 {
			runtimeEntry = strings.Join(append(runtimeImports, runtimeRegistrations...), "\n")
		}

		runtimeFileName := fmt.Sprintf("%[1]s/runtime.ts", baseURL)

		err := os.WriteFile(runtimeFileName, []byte(runtimeEntry), 0777)
		if err != nil {
			return nil, err
		}

		entryPoints = append(entryPoints, runtimeFileName)

	}

	return entryPoints, nil

}
