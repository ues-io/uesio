package bulk

import (
	"encoding/csv"
	"io"

	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func WriteCSVItem(csvwriter *csv.Writer, item meta.Item, collectionMetadata *wire.CollectionMetadata, columnIndexes map[string]int) error {
	data := make([]string, len(columnIndexes))

	err := item.Loop(func(fieldName string, value any) error {
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

func NewCSVExportCollection(writer io.Writer, collectionMetadata *wire.CollectionMetadata) *CSVExportCollection {

	csvwriter := csv.NewWriter(writer)
	columnIndexes := map[string]int{}
	header := make([]string, len(collectionMetadata.Fields))
	index := 0
	for fieldName := range collectionMetadata.Fields {
		columnIndexes[fieldName] = index
		header[index] = fieldName
		index++
	}

	csvwriter.Write(header)
	csvwriter.Flush()

	return &CSVExportCollection{
		writer:             csvwriter,
		collectionMetadata: collectionMetadata,
		columnIndexes:      columnIndexes,
	}
}

type CSVExportCollection struct {
	writer             *csv.Writer
	collectionMetadata *wire.CollectionMetadata
	columnIndexes      map[string]int
}

func (c *CSVExportCollection) GetItem(index int) meta.Item {
	return nil
}

func (c *CSVExportCollection) NewItem() meta.Item {
	return &wire.Item{}
}

func (c *CSVExportCollection) AddItem(item meta.Item) error {
	return WriteCSVItem(c.writer, item, c.collectionMetadata, c.columnIndexes)
}

func (c *CSVExportCollection) Loop(iter meta.GroupIterator) error {
	return nil
}

func (c *CSVExportCollection) Len() int {
	return 0
}
