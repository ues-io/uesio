package retrieve

import (
	"archive/zip"
	"io"
	"path/filepath"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"gopkg.in/yaml.v3"
)

// Retrieve func
func Retrieve(session *sess.Session) ([]bundlestore.ItemStream, error) {
	namespace := session.GetWorkspaceApp()
	version, bs, err := bundle.GetBundleStoreWithVersion(namespace, session)
	if err != nil {
		return nil, err
	}
	return RetrieveBundle(namespace, version, bs, session)
}

func RetrieveBundle(namespace, version string, bs bundlestore.BundleStore, session *sess.Session) ([]bundlestore.ItemStream, error) {
	itemStreams := []bundlestore.ItemStream{}

	for _, metadataType := range meta.GetMetadataTypes() {
		group, err := meta.GetBundleableGroupFromType(metadataType)
		if err != nil {
			return nil, err
		}
		err = bs.GetItems(group, namespace, version, nil, session)
		if err != nil {
			return nil, err
		}

		err = group.Loop(func(item loadable.Item) error {

			path := item.(meta.BundleableItem).GetPath()

			// Special handling for bots
			if metadataType == "bots" {
				bot := item.(*meta.Bot)

				stream, err := bs.GetBotStream(version, bot, session)
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
				file := item.(*meta.File)

				stream, err := bs.GetFileStream(version, file, session)
				if err != nil {
					return err
				}

				itemStream := bundlestore.ItemStream{
					FileName: file.GetFilePath(),
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
	bundleDefStream := bundlestore.ItemStream{
		FileName: "bundle.yaml",
		Type:     "",
	}

	by, err := bs.GetBundleDef(namespace, version, session)
	if err != nil {
		return nil, err
	}

	encoder := yaml.NewEncoder(&bundleDefStream.Buffer)
	encoder.SetIndent(2)

	err = encoder.Encode(by)
	if err != nil {
		return nil, err
	}

	itemStreams = append(itemStreams, bundleDefStream)

	return itemStreams, nil

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
