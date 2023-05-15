package meta

import (
	"fmt"
	"os"
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
	OsPath := string(os.PathSeparator)
	tenantPath := strings.ReplaceAll(tenantID, ":", OsPath)
	return fmt.Sprintf("files%s%s%s%s", OsPath, tenantPath, OsPath, ufm.GetRelativePath())
}

func (ufm *UserFileMetadata) GetRelativePath() string {
	OsPath := string(os.PathSeparator)
	collectionPath := strings.ReplaceAll(ufm.CollectionID, ".", OsPath)
	fieldPath := strings.ReplaceAll(ufm.FieldID, ".", OsPath)
	if ufm.FieldID != "" {
		return fmt.Sprintf("%s%s%s%s%s%s%s%s%s%s", collectionPath, OsPath, ufm.RecordID, OsPath, "field", OsPath, fieldPath, OsPath, ufm.Path, OsPath)
	}
	return fmt.Sprintf("%s%s%s%s%s%s%s", collectionPath, OsPath, ufm.RecordID, OsPath, "attachment", OsPath, ufm.Path)
}
