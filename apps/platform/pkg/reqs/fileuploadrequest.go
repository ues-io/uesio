package reqs

import (
	"errors"
	"net/url"
)

// FileDetails struct
type FileDetails struct {
	ContentLength    uint64
	Name             string
	CollectionID     string
	RecordID         string
	FieldID          string
	FileCollectionID string
}

// ConvertQueryToFileDetails function
func ConvertQueryToFileDetails(query url.Values) (*FileDetails, error) {

	name := query.Get("name")
	if name == "" {
		return nil, errors.New("No name specified")
	}

	fileCollection := query.Get("filecollection")
	if fileCollection == "" {
		return nil, errors.New("No filecollection specified")
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
		Name:             name,
		FileCollectionID: fileCollection,
		CollectionID:     collectionID,
		RecordID:         recordID,
		FieldID:          fieldID,
	}, nil
}
