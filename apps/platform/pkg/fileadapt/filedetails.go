package fileadapt

import (
	"errors"
	"net/url"
)

type FileDetails struct {
	ContentLength   int64
	Path            string
	CollectionID    string
	RecordID        string
	RecordUniqueKey string
	FieldID         string
}

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
		Path:         name,
		CollectionID: collectionID,
		RecordID:     recordID,
		FieldID:      fieldID,
	}, nil
}
