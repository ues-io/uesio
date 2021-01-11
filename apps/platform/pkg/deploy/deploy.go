package deploy

import (
	"archive/zip"
	"bytes"
	"errors"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"gopkg.in/yaml.v3"
)

// Deploy func
func Deploy(body []byte, session *sess.Session) error {

	zipReader, err := zip.NewReader(bytes.NewReader(body), int64(len(body)))
	if err != nil {
		return err
	}

	workspace := session.GetWorkspaceID()

	if workspace == "" {
		return errors.New("No Workspace provided for deployment")
	}

	dep := map[string]metadata.BundleableGroup{}

	fileStreams := []bundlestore.ReadItemStream{}
	fileNameMap := map[string]string{}

	// Read all the files from zip archive
	for _, zipFile := range zipReader.File {
		fileName := zipFile.Name
		// Don't forget to fix the windows filenames here
		dir := filepath.Dir(fileName)

		dirParts := strings.Split(dir, string(os.PathSeparator))
		if len(dirParts) == 1 && fileName == "bundle/bundle.yaml" {
			//Break down bundle.yaml into dependency records
			by := metadata.BundleDef{}
			readCloser, err := zipFile.Open()
			if err != nil {
				return err
			}
			err = bundlestore.DecodeYAML(&by, readCloser)
			readCloser.Close()
			if err != nil {
				return err
			}
			if by.Dependencies != nil && len(by.Dependencies) != 0 {
				for key := range by.Dependencies {
					dep := by.Dependencies[key]
					//TODO: Slow - probably should be batched
					err = datasource.AddDependency(workspace, key, dep.Version, session)
					if err != nil {
						return err
					}
				}
			}
			continue
		}
		if len(dirParts) != 2 {
			continue
		}
		metadataType := dirParts[1]

		extension := filepath.Ext(fileName)
		base := filepath.Base(fileName)

		// Special handling for files and bots
		if (metadataType == "files" || metadataType == "bots") && extension != ".yaml" && extension != "" {
			f, err := zipFile.Open()
			if err != nil {
				return err
			}
			fileStreams = append(fileStreams, bundlestore.ReadItemStream{
				Type:     metadataType,
				FileName: base,
				Data:     f,
			})
		}

		if extension != ".yaml" {
			continue
		}

		collection, ok := dep[metadataType]
		if !ok {
			collection, err = metadata.GetBundleableGroupFromType(metadataType)
			if err != nil {
				// Most likely found a folder that we don't have a metadata type for
				logger.Log("Found bad metadata type: "+metadataType, logger.INFO)
				continue
			}
			dep[metadataType] = collection
		}

		if collection == nil {
			continue
		}

		collectionItem, err := collection.NewBundleableItemWithKey(strings.TrimSuffix(base, extension))
		if err != nil {
			return err
		}
		err = readZipFile(zipFile, collectionItem)
		if err != nil {
			log.Println(err)
			continue
		}

		// Special handling for files
		if metadataType == "files" {
			file := collectionItem.(*metadata.File)
			fileNameMap[metadataType+":"+file.FileName] = file.GetKey()
		}

		// Special handling for bots
		if metadataType == "bots" {
			bot := collectionItem.(*metadata.Bot)
			fileNameMap[metadataType+":"+bot.FileName] = bot.GetKey()
		}

		collectionItem.SetWorkspace(workspace)
		collection.AddItem(collectionItem)

	}

	for _, collection := range dep {

		length := collection.Len()
		if length > 0 {
			_, err = datasource.PlatformSave([]datasource.PlatformSaveRequest{
				{
					Collection: collection,
					Options: &adapters.SaveOptions{
						Upsert: &adapters.UpsertOptions{},
					},
				},
			}, session)
			if err != nil {
				return err
			}
		}
	}

	// Read the filestreams
	for _, fileStream := range fileStreams {
		defer fileStream.Data.Close()

		var recordID string

		itemKey, ok := fileNameMap[fileStream.Type+":"+fileStream.FileName]
		if !ok {
			continue
		}
		// Special handling for files
		if fileStream.Type == "files" {
			file, err := metadata.NewFile(itemKey)
			if err != nil {
				return err
			}
			recordID = file.Name
		}

		// Special handling for bots
		if fileStream.Type == "bots" {
			bot, err := metadata.NewBot(itemKey)
			if err != nil {
				return err
			}
			recordID = bot.CollectionRef + "_" + bot.Type + "_" + bot.Name
		}

		fileDetails := datasource.FileDetails{
			Name:             fileStream.FileName,
			CollectionID:     "uesio." + fileStream.Type,
			RecordID:         session.GetWorkspaceID() + "_" + recordID,
			FieldID:          "uesio.content",
			FileCollectionID: "uesio.workspacemetadatafiles",
		}

		_, err := filesource.Upload(fileStream.Data, fileDetails, session.RemoveWorkspaceContext())
		if err != nil {
			return err
		}
	}

	// Clear out the bundle definition cache
	bundles.ClearAppBundleCache(session)

	return nil

}

func readZipFile(zf *zip.File, item metadata.BundleableItem) error {
	f, err := zf.Open()
	if err != nil {
		return err
	}
	defer f.Close()

	decoder := yaml.NewDecoder(f)

	err = decoder.Decode(item)
	if err != nil {
		return err
	}

	return nil
}
