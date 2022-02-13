package retrieve

import (
	"archive/zip"
	"bytes"
	"io"
	"path/filepath"

	"github.com/humandad/yaml"
	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
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
	itemStreams := bundlestore.ItemStreams{}

	for _, metadataType := range meta.GetMetadataTypes() {
		group, err := meta.GetBundleableGroupFromType(metadataType)
		if err != nil {
			return nil, err
		}
		err = bs.GetAllItems(group, namespace, version, nil, session)
		if err != nil {
			return nil, err
		}

		err = group.Loop(func(item loadable.Item, _ interface{}) error {

			path := item.(meta.BundleableItem).GetPath()
			// Grabs the componentpack javascript files
			if metadataType == "componentpacks" {
				cp := item.(*meta.ComponentPack)
				builderStream, err := bs.GetComponentPackStream(version, true, cp, session)
				if err != nil {
					return err
				}

				builderItem := itemStreams.AddFile(cp.GetBuilderComponentPackFilePath(), metadataType)
				_, err = io.Copy(builderItem, builderStream)
				if err != nil {
					return err
				}

				runtimeStream, err := bs.GetComponentPackStream(version, false, cp, session)
				if err != nil {
					return err
				}

				runtimeItem := itemStreams.AddFile(cp.GetComponentPackFilePath(), metadataType)
				_, err = io.Copy(runtimeItem, runtimeStream)
				if err != nil {
					return err
				}

			}
			// Special handling for bots
			if metadataType == "bots" {
				bot := item.(*meta.Bot)

				stream, err := bs.GetBotStream(version, bot, session)
				if err != nil {
					return err
				}

				itemStream := itemStreams.AddFile(bot.GetBotFilePath(), metadataType)

				_, err = io.Copy(itemStream, stream)
				if err != nil {
					return err
				}

			}

			// Special handling for files
			if metadataType == "files" {
				file := item.(*meta.File)

				if file.Content != nil {
					stream, err := bs.GetFileStream(version, file, session)
					if err != nil {
						return err
					}

					itemStream := itemStreams.AddFile(file.GetFilePath(), metadataType)

					_, err = io.Copy(itemStream, stream)
					if err != nil {
						return err
					}

				}

			}

			itemStream := itemStreams.AddFile(path, metadataType)

			encoder := yaml.NewEncoder(itemStream)
			encoder.SetIndent(2)

			err = encoder.Encode(item)
			if err != nil {
				return err
			}

			return nil
		})
		if err != nil {
			return nil, err
		}

	}
	bundleDefStream := bundlestore.ItemStream{
		FileName: "bundle.yaml",
		Type:     "",
		Buffer:   &bytes.Buffer{},
	}

	by, err := bs.GetBundleDef(namespace, version, session)
	if err != nil {
		return nil, err
	}

	encoder := yaml.NewEncoder(bundleDefStream.Buffer)
	encoder.SetIndent(2)

	err = encoder.Encode(by)
	if err != nil {
		return nil, err
	}

	itemStreams = append(itemStreams, bundleDefStream)

	return itemStreams, nil

}

// Zip function
func Zip(writer io.Writer, files []bundlestore.ItemStream, session *sess.Session) error {

	// Create a new zip archive.
	zipWriter := zip.NewWriter(writer)

	for _, itemStream := range files {
		f, err := zipWriter.Create(filepath.Join(itemStream.Type, itemStream.FileName))
		if err != nil {
			return err
		}

		_, err = io.Copy(f, itemStream.Buffer)
		if err != nil {
			return err
		}
	}

	// Make sure to check the error on Close.
	return zipWriter.Close()

}
