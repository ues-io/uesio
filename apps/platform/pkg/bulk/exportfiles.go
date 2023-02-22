package bulk

import (
	"encoding/csv"
	"fmt"
	"io"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func WriteCSVItem(csvwriter *csv.Writer, item meta.Item, collectionMetadata *adapt.CollectionMetadata, columnIndexes map[string]int) error {
	data := make([]string, len(columnIndexes))
	err := item.Loop(func(fieldName string, value interface{}) error {
		fieldMetadata, err := collectionMetadata.GetField(fieldName)
		if err != nil {
			return err
		}

		stringVal, err := getStringValue(fieldMetadata, value)
		if err != nil {
			return err
		}

		index := columnIndexes[fieldName]
		data[index] = stringVal

		return nil
	})
	if err != nil {
		return err
	}
	err = csvwriter.Write(data)
	if err != nil {
		return err
	}
	csvwriter.Flush()
	return csvwriter.Error()
}

func exportFiles(create retrieve.WriterCreator, spec *meta.JobSpec, session *sess.Session) error {

	// Now do a special userfile export
	userFiles := &meta.UserFileMetadataCollection{}
	err := datasource.PlatformLoad(
		userFiles,
		&datasource.PlatformLoadOptions{
			Conditions: []adapt.LoadRequestCondition{
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

	file, err := create(fmt.Sprintf("%s.csv", strings.ReplaceAll(userFiles.GetName(), "/", "_")))
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
		filedata, _, err := filesource.DownloadItem(userFile, session)
		if err != nil {
			return err
		}
		file, err := create(fmt.Sprintf("files/%s/%s", userFile.ID, userFile.FileName))
		if err != nil {
			return err
		}
		_, err = io.Copy(file, filedata)
		if err != nil {
			return err
		}
	}

	return nil
}
