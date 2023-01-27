package bulk

import (
	"bytes"
	"encoding/csv"
	"io"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func NewCSVExportItem(collectionMetadata *adapt.CollectionMetadata) *CSVExportItem {
	columnIndexes := map[string]int{}
	index := 0
	for fieldName := range collectionMetadata.Fields {
		columnIndexes[fieldName] = index
		index++
	}
	return &CSVExportItem{
		data:               make([]string, len(columnIndexes)),
		collectionMetadata: collectionMetadata,
		columnIndexes:      columnIndexes,
	}
}

type CSVExportItem struct {
	data               []string
	columnIndexes      map[string]int
	collectionMetadata *adapt.CollectionMetadata
}

func (i *CSVExportItem) SetField(fieldName string, value interface{}) error {
	if value == nil {
		return nil
	}
	fieldMetadata, err := i.collectionMetadata.GetField(fieldName)
	if err != nil {
		return err
	}

	stringVal, err := getStringValue(fieldMetadata, value)
	if err != nil {
		return err
	}
	index := i.columnIndexes[fieldName]
	i.data[index] = stringVal

	return nil
}

func (i *CSVExportItem) Reset() {
	for _, index := range i.columnIndexes {
		i.data[index] = ""
	}
}

func (i *CSVExportItem) GetData() []string {
	return i.data
}

func (i *CSVExportItem) GetField(fieldName string) (interface{}, error) {
	return nil, nil
}

func (i *CSVExportItem) Loop(iter func(string, interface{}) error) error {
	return nil
}

func (i *CSVExportItem) Len() int {
	return 0
}

func NewCSVExportCollection(collectionMetadata *adapt.CollectionMetadata) *CSVExportCollection {
	buffer := &bytes.Buffer{}
	return &CSVExportCollection{
		buffer:             buffer,
		writer:             csv.NewWriter(buffer),
		current:            NewCSVExportItem(collectionMetadata),
		collectionMetadata: collectionMetadata,
	}
}

type CSVExportCollection struct {
	current            *CSVExportItem
	buffer             *bytes.Buffer
	writer             *csv.Writer
	hasHeader          bool
	collectionMetadata *adapt.CollectionMetadata
}

func (c *CSVExportCollection) GetItem(index int) meta.Item {
	return nil
}

func (c *CSVExportCollection) NewItem() meta.Item {
	return c.current
}

func (c *CSVExportCollection) AddItem(item meta.Item) {
	if !c.hasHeader {
		// write the header row
		for fieldName := range c.collectionMetadata.Fields {
			// We could use the label here if we wanted
			// We also have some flexibility if we sent in the spec
			// for more interesting field mappings
			index := c.current.columnIndexes[fieldName]
			c.current.data[index] = fieldName
		}
		c.hasHeader = true
	}

	err := c.writer.Write(c.current.GetData())
	if err != nil {
		// Probably shouldn't be ignoring errors here...
	}
	c.current.Reset()
}

func (c *CSVExportCollection) Loop(iter meta.GroupIterator) error {
	return nil
}

func (c *CSVExportCollection) Len() int {
	return 0
}

func (c *CSVExportCollection) GetData() (io.Reader, error) {
	// Write the last line
	err := c.writer.Write(c.current.GetData())
	if err != nil {
		return nil, err
	}
	c.writer.Flush()
	err = c.writer.Error()
	if err != nil {
		return nil, err
	}
	return c.buffer, nil
}
