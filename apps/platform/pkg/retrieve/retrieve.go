package retrieve

import (
	"archive/zip"
	"io"
	"path/filepath"
	"reflect"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/sess"

	"github.com/thecloudmasters/uesio/pkg/reqs"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"gopkg.in/yaml.v3"
)

// Retrieve func
func Retrieve(session *sess.Session) ([]reqs.ItemStream, error) {

	itemStreams := []reqs.ItemStream{}

	for _, metadataType := range metadata.GetMetadataTypes() {
		group, err := metadata.GetBundleableGroupFromType(metadataType)
		if err != nil {
			return nil, err
		}
		err = datasource.LoadMetadataCollection(group, session.GetWorkspaceApp(), nil, session)
		if err != nil {
			return nil, err
		}

		length := reflect.Indirect(reflect.ValueOf(group)).Len()

		for i := 0; i < length; i++ {
			item := group.GetItem(i)
			key := item.GetKey()

			itemStream := reqs.ItemStream{
				Path: filepath.Join(metadataType, key+".yaml"),
			}

			err = yaml.NewEncoder(&itemStream.Buffer).Encode(item)
			if err != nil {
				return nil, err
			}

			itemStreams = append(itemStreams, itemStream)
		}

	}
	bundleYaml, err := generateBundleYaml(session)
	if err != nil {
		return nil, err
	}
	itemStreams = append(itemStreams, *bundleYaml)

	return itemStreams, nil

}

func generateBundleYaml(session *sess.Session) (*reqs.ItemStream, error) {
	itemStream := reqs.ItemStream{
		Path: "bundle.yaml",
	}
	var by metadata.BundleDef
	by.Name = session.GetWorkspaceApp()
	bdc, err := datasource.GetBundleDependenciesForWorkspace(session.GetWorkspaceID(), session)

	if err != nil {
		return nil, err
	}
	if len(*bdc) != 0 {
		by.Dependencies = map[string]metadata.BundleDefDep{}
	}
	for _, bd := range *bdc {
		name := bd.BundleName
		version := bd.BundleVersion
		bundleStore, err := bundlestore.GetBundleStore(name, session)
		if err != nil {
			return nil, err
		}
		dep, err := getBundleYamlForDep(bundleStore, name, version)
		if err != nil {
			return nil, err
		}
		by.Dependencies[name] = *dep
	}
	err = yaml.NewEncoder(&itemStream.Buffer).Encode(by)
	if err != nil {
		return nil, err
	}
	return &itemStream, nil
}

func getBundleYamlForDep(bundleStore bundlestore.BundleStore, name string, version string) (*metadata.BundleDefDep, error) {
	dep := metadata.BundleDefDep{Version: version}

	stream, err := bundleStore.GetItem(name, version, "", "bundle.yaml")
	if err != nil {
		return nil, err
	}
	defer stream.Close()

	err = bundlestore.DecodeYAML(&dep, stream)
	if err != nil {
		return nil, err
	}
	return &dep, nil
}

// Zip function
func Zip(writer io.Writer, session *sess.Session) error {

	// Create a new zip archive.
	zipWriter := zip.NewWriter(writer)

	itemStreams, err := Retrieve(session)
	if err != nil {
		return err
	}

	for _, itemStream := range itemStreams {
		f, err := zipWriter.Create(itemStream.Path)
		if err != nil {
			return err
		}

		_, err = io.Copy(f, &itemStream.Buffer)
		if err != nil {
			return err
		}
	}

	// Make sure to check the error on Close.
	err = zipWriter.Close()
	if err != nil {
		return err
	}

	return nil
}
