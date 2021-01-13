package retrieve

import (
	"archive/zip"
	"io"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"gopkg.in/yaml.v3"
)

// Retrieve func
func Retrieve(session *sess.Session) ([]bundlestore.ItemStream, error) {

	itemStreams := []bundlestore.ItemStream{}

	for _, metadataType := range metadata.GetMetadataTypes() {
		group, err := metadata.GetBundleableGroupFromType(metadataType)
		if err != nil {
			return nil, err
		}
		err = bundles.LoadAll(group, session.GetWorkspaceApp(), nil, session)
		if err != nil {
			return nil, err
		}

		err = group.Loop(func(item adapters.LoadableItem) error {

			path := item.(metadata.BundleableItem).GetPath()

			// Special handling for bots
			if metadataType == "bots" {
				bot := item.(*metadata.Bot)

				stream, err := bundles.GetBotStream(bot, session)
				if err != nil {
					return err
				}

				itemStream := bundlestore.ItemStream{
					FileName: bot.GetBotFilePath(),
					Type:     metadataType,
				}

				_, err = io.Copy(&itemStream.Buffer, stream)
				if err != nil {
					return err
				}

				itemStreams = append(itemStreams, itemStream)

			}

			// Special handling for files
			if metadataType == "files" {
				file := item.(*metadata.File)

				stream, err := bundles.GetFileStream(file, session)
				if err != nil {
					return err
				}

				itemStream := bundlestore.ItemStream{
					FileName: file.FileName,
					Type:     metadataType,
				}

				_, err = io.Copy(&itemStream.Buffer, stream)
				if err != nil {
					return err
				}

				itemStreams = append(itemStreams, itemStream)
			}

			itemStream := bundlestore.ItemStream{
				FileName: path,
				Type:     metadataType,
			}

			encoder := yaml.NewEncoder(&itemStream.Buffer)
			encoder.SetIndent(2)

			err = encoder.Encode(item)
			if err != nil {
				return err
			}

			itemStreams = append(itemStreams, itemStream)
			return nil
		})
		if err != nil {
			return nil, err
		}

	}
	bundleYaml, err := generateBundleYaml(session)
	if err != nil {
		return nil, err
	}
	itemStreams = append(itemStreams, *bundleYaml)

	return itemStreams, nil

}

func generateBundleYaml(session *sess.Session) (*bundlestore.ItemStream, error) {
	itemStream := bundlestore.ItemStream{
		FileName: "bundle.yaml",
		Type:     "",
	}

	by := session.GetContextAppBundle()

	encoder := yaml.NewEncoder(&itemStream.Buffer)
	encoder.SetIndent(2)

	err := encoder.Encode(by)
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
	return zipWriter.Close()

}
