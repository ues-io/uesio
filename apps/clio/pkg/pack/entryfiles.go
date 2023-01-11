package pack

import (
	"fmt"
	"os"
	"strings"

	"github.com/thecloudmasters/clio/pkg/localbundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type PackData struct {
	Components *meta.ComponentCollection
	Utilities  *meta.UtilityCollection
}

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

	components := &meta.ComponentCollection{}
	err = sbs.GetAllItems(components, "", "", nil, nil)
	if err != nil {
		return nil, err
	}

	utilities := &meta.UtilityCollection{}
	err = sbs.GetAllItems(utilities, "", "", nil, nil)
	if err != nil {
		return nil, err
	}

	entryPoints := []string{}

	packMap := map[string]PackData{}

	// Coalate components by pack
	for _, component := range *components {
		pack := component.Pack
		if pack == "" {
			continue
		}
		packData, ok := packMap[pack]
		if !ok {
			packMap[pack] = PackData{
				Components: &meta.ComponentCollection{},
				Utilities:  &meta.UtilityCollection{},
			}
			packData = packMap[pack]
		}
		*packData.Components = append(*packData.Components, component)
	}

	// Coalate utilities by pack
	for _, utility := range *utilities {
		pack := utility.Pack
		if pack == "" {
			continue
		}
		packData, ok := packMap[pack]
		if !ok {
			packMap[pack] = PackData{
				Components: &meta.ComponentCollection{},
				Utilities:  &meta.UtilityCollection{},
			}
			packData = packMap[pack]
		}
		*packData.Utilities = append(*packData.Utilities, utility)
	}

	// Create the entry files
	for packName, packData := range packMap {
		runtimeImports := []string{"import { component } from \"@uesio/ui\";"}
		runtimeRegistrations := []string{}

		if len(*packData.Components) == 0 && len(*packData.Utilities) == 0 {
			fmt.Println("no components or utilities listed to pack in bundle.yaml")
			continue
		}

		baseURL := fmt.Sprintf("bundle/componentpacks/%s/", packName)
		srcURL := fmt.Sprintf("%s/src/", baseURL)
		// Loop over the components
		for _, comp := range *packData.Components {
			hasDefinition := fileExists(fmt.Sprintf("%s/%s.tsx", srcURL, comp.EntryPoint))
			if hasDefinition {
				runtimeImports = append(runtimeImports, fmt.Sprintf("import %s from \"./src/%s\";", comp.Name, comp.EntryPoint))
				runtimeRegistrations = append(runtimeRegistrations, fmt.Sprintf("component.registry.register(\"%[2]s.%[1]s\",%[1]s);", comp.Name, namespace))
			}
		}

		for _, util := range *packData.Utilities {
			hasDefinition := fileExists(fmt.Sprintf("%s/%s.tsx", srcURL, util.EntryPoint))
			if hasDefinition {
				runtimeImports = append(runtimeImports, fmt.Sprintf("import %s_utility from \"./src/%s\";", util.Name, util.EntryPoint))
				runtimeRegistrations = append(runtimeRegistrations, fmt.Sprintf("component.registry.registerUtilityComponent(\"%[2]s.%[1]s\",%[1]s_utility)", util.Name, namespace))
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
