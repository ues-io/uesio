package retrieve

import (
	"archive/zip"
	"io"
	"path/filepath"
	"reflect"

	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/sess"

	"github.com/thecloudmasters/uesio/pkg/reqs"

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
		err = bundles.LoadAll(group, session.GetWorkspaceApp(), nil, session)
		if err != nil {
			return nil, err
		}

		length := reflect.Indirect(reflect.ValueOf(group)).Len()

		for i := 0; i < length; i++ {
			item := group.GetItem(i)
			key := item.GetKey()

			itemStream := reqs.ItemStream{
				FileName: key + ".yaml",
				Type:     metadataType,
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
		FileName: "bundle.yaml",
		Type:     "",
	}

	bundleStore, err := bundlestore.GetBundleStore(session.GetWorkspaceApp(), session)
	if err != nil {
		return nil, err
	}

	by, err := bundleStore.GetBundleDef(session.GetWorkspaceApp(), session.GetWorkspace().Name, session)
	if err != nil {
		return nil, err
	}

	err = yaml.NewEncoder(&itemStream.Buffer).Encode(by)
	if err != nil {
		return nil, err
	}
	return &itemStream, nil
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
		f, err := zipWriter.Create(filepath.Join(itemStream.Type, itemStream.FileName))
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
