package retrieve

import (
	"archive/zip"
	"io"
	"path/filepath"
	"reflect"

	"github.com/thecloudmasters/uesio/pkg/reqs"

	"github.com/icza/session"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"gopkg.in/yaml.v3"
)

// Retrieve func
func Retrieve(site *metadata.Site, sess *session.Session) ([]reqs.ItemStream, error) {

	itemStreams := []reqs.ItemStream{}

	for _, metadataType := range metadata.GetMetadataTypes() {
		group, err := metadata.GetBundleableGroupFromType(metadataType)
		if err != nil {
			return nil, err
		}
		err = datasource.LoadMetadataCollection(group, site.GetWorkspaceApp(), nil, site, sess)
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

	return itemStreams, nil

}

// Zip function
func Zip(writer io.Writer, site *metadata.Site, sess *session.Session) error {

	// Create a new zip archive.
	zipWriter := zip.NewWriter(writer)

	itemStreams, err := Retrieve(site, sess)
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
