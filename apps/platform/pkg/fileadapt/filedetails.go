package fileadapt

import (
	"errors"
	"net/url"
)

// FileDetails struct
type FileDetails struct {
	ContentLength   uint64
	Name            string
	CollectionID    string
	RecordID        string
	RecordUniqueKey string
	FieldID         string
}

// NewFileDetails function
func NewFileDetails(query url.Values) (*FileDetails, error) {

	name := query.Get("name")
	if name == "" {
		return nil, errors.New("No name specified")
	}

	collectionID := query.Get("collectionid")
	if collectionID == "" {
		return nil, errors.New("No collectionid specified")
	}

	recordID := query.Get("recordid")
	if recordID == "" {
		return nil, errors.New("No recordid specified")
	}

	//Not required. If not specified is treated as an attachment
	fieldID := query.Get("fieldid")

	return &FileDetails{
		Name:         name,
		CollectionID: collectionID,
		RecordID:     recordID,
		FieldID:      fieldID,
	}, nil
}
