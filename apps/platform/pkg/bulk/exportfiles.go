package bulk

import (
	"encoding/csv"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bundlestore"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func exportFiles(create bundlestore.FileCreator, spec *meta.JobSpec, session *sess.Session) error {

	// Now do a special userfile export
	userFiles := &meta.UserFileMetadataCollection{}
	err := datasource.PlatformLoad(
		userFiles,
		&datasource.PlatformLoadOptions{
			Conditions: []wire.LoadRequestCondition{
				{
					Field: "uesio/core.collectionid",
					Value: spec.Collection,
				},
			},
		},
		session,
	)
	if err != nil {
		return err
	}

	metadataResponse, err := getBatchMetadata(userFiles.GetName(), session)
	if err != nil {
		return err
	}

	collectionMetadata, err := metadataResponse.GetCollection(userFiles.GetName())
	if err != nil {
		return err
	}

	file, err := create(strings.ReplaceAll(userFiles.GetName(), "/", "_") + ".csv")
	if err != nil {
		return err
	}

	csvwriter := csv.NewWriter(file)
	columnIndexes := map[string]int{}
	header := make([]string, len(userFiles.GetFields()))
	index := 0
	for _, fieldName := range userFiles.GetFields() {
		columnIndexes[fieldName] = index
		header[index] = fieldName
		index++
	}

	csvwriter.Write(header)
	csvwriter.Flush()

	for _, userFile := range *userFiles {

		err = WriteCSVItem(csvwriter, userFile, collectionMetadata, columnIndexes)
		if err != nil {
			return err
		}
	}

	for _, userFile := range *userFiles {
		file, err := create(fmt.Sprintf("files/%s/%s", userFile.ID, userFile.Path()))
		if err != nil {
			return err
		}
		_, err = filesource.DownloadItem(file, userFile, session)
		if err != nil {
			return err
		}
	}

	return nil
}
