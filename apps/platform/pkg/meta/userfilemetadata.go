package meta

import (
	"fmt"
	"strings"
)

type UserFileMetadata struct {
	BuiltIn       `yaml:",inline"`
	CollectionID  string `json:"uesio/core.collectionid"`
	MimeType      string `json:"uesio/core.mimetype"`
	FieldID       string `json:"uesio/core.fieldid"`
	FileSourceID  string `json:"uesio/core.filesourceid"`
	Path          string `json:"uesio/core.path"`
	RecordID      string `json:"uesio/core.recordid"`
	Type          string `json:"uesio/core.type"`
	ContentLength int64  `json:"uesio/core.contentlength"`
}

func (ufm *UserFileMetadata) GetCollectionName() string {
	return USERFILEMETADATA_COLLECTION_NAME
}

func (ufm *UserFileMetadata) SetField(fieldName string, value interface{}) error {
	return StandardFieldSet(ufm, fieldName, value)
}

func (ufm *UserFileMetadata) GetField(fieldName string) (interface{}, error) {
	return StandardFieldGet(ufm, fieldName)
}

func (ufm *UserFileMetadata) Loop(iter func(string, interface{}) error) error {
	return StandardItemLoop(ufm, iter)
}

func (ufm *UserFileMetadata) Len() int {
	return StandardItemLen(ufm)
}

func (ufm *UserFileMetadata) GetFullPath(tenantID string) string {
	tenantPath := strings.ReplaceAll(tenantID, ":", "/")
	return fmt.Sprintf("files/%s/%s", tenantPath, ufm.GetRelativePath())
}

func (ufm *UserFileMetadata) GetRelativePath() string {
	collectionPath := strings.ReplaceAll(ufm.CollectionID, ".", "/")
	fieldPath := strings.ReplaceAll(ufm.FieldID, ".", "/")
	if ufm.FieldID != "" {
		return fmt.Sprintf("%s/%s/field/%s/%s", collectionPath, ufm.RecordID, fieldPath, ufm.Path)
	}
	return fmt.Sprintf("%s/%s/attachment/%s", collectionPath, ufm.RecordID, ufm.Path)
}

func (ufm *UserFileMetadata) UnmarshalJSON(data []byte) error {
	type alias UserFileMetadata
	return refScanner((*alias)(ufm), data)
}
