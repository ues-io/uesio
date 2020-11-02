package deploy

import (
	"archive/zip"
	"bytes"
	"errors"
	"io"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"reflect"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"

	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"

	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/metadata"
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

	fileStreams := map[string]io.ReadCloser{}
	fileNameMap := map[string]string{}
	botStreams := map[string]io.ReadCloser{}
	botNameMap := map[string]string{}

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

		// Special handling for files
		if metadataType == "files" && extension != ".yaml" && extension != "" {
			f, err := zipFile.Open()
			if err != nil {
				return err
			}
			fileStreams[base] = f
		}

		// Special handling for bots
		if metadataType == "bots" && extension != ".yaml" && extension != "" {
			f, err := zipFile.Open()
			if err != nil {
				return err
			}
			botStreams[base] = f
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

		collectionItem := collection.NewItem()
		err = readZipFile(zipFile, collectionItem)
		if err != nil {
			log.Println(err)
			continue
		}

		// Special handling for files
		if metadataType == "files" {
			file := collectionItem.(*metadata.File)
			fileNameMap[file.FileName] = file.Name
		}

		// Special handling for bots
		if metadataType == "bots" {
			bot := collectionItem.(*metadata.Bot)
			botNameMap[bot.FileName] = bot.GetKey()
		}

		collectionItem.SetWorkspace(workspace)
		collection.AddItem(collectionItem)

	}

	// Read the botstreams
	for botName, botStream := range botStreams {
		defer botStream.Close()

		key, ok := botNameMap[botName]
		if !ok {
			continue
		}

		b, err := ioutil.ReadAll(botStream)
		if err != nil {
			log.Fatal(err)
		}

		bots := dep["bots"]

		// Loop over the bots and add their code
		length := reflect.Indirect(reflect.ValueOf(bots)).Len()

		for i := 0; i < length; i++ {
			bot := bots.GetItem(i).(*metadata.Bot)
			if bot.GetKey() == key {
				bot.FileContents = string(b)
			}
		}

	}

	for _, collection := range dep {
		length := reflect.Indirect(reflect.ValueOf(collection)).Len()
		if length > 0 {
			_, err = datasource.PlatformSave([]datasource.PlatformSaveRequest{
				{
					Collection: collection,
					Options: &reqs.SaveOptions{
						Upsert: &reqs.UpsertOptions{},
					},
				},
			}, session)
			if err != nil {
				return err
			}
		}
	}

	// Read the filestreams
	for fileName, fileStream := range fileStreams {
		defer fileStream.Close()

		name, ok := fileNameMap[fileName]
		if !ok {
			continue
		}

		fileDetails := reqs.FileDetails{
			Name:             fileName,
			CollectionID:     "uesio.files",
			RecordID:         session.GetWorkspaceID() + "_" + name,
			FieldID:          "uesio.content",
			FileCollectionID: "uesio.workspacemetadatafiles",
		}

		_, err := filesource.Upload(fileStream, fileDetails, session)
		if err != nil {
			return err
		}
	}

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
