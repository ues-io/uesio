package meta

import (
	"strconv"
)

type RecordChallengeTokenCollection []*RecordChallengeToken

var RECORDCHALLENGETOKEN_COLLECTION_NAME = "uesio/studio.recordchallengetoken"
var RECORDCHALLENGETOKEN_FOLDER_NAME = "recordchallengetokens"
var RECORDCHALLENGETOKEN_FIELDS = StandardGetFields(&RecordChallengeToken{})

func (rctc *RecordChallengeTokenCollection) GetName() string {
	return RECORDCHALLENGETOKEN_COLLECTION_NAME
}

func (rctc *RecordChallengeTokenCollection) GetBundleFolderName() string {
	return RECORDCHALLENGETOKEN_FOLDER_NAME
}

func (rctc *RecordChallengeTokenCollection) GetFields() []string {
	return RECORDCHALLENGETOKEN_FIELDS
}

func (rctc *RecordChallengeTokenCollection) NewItem() Item {
	return &RecordChallengeToken{}
}

func (rctc *RecordChallengeTokenCollection) AddItem(item Item) error {
	*rctc = append(*rctc, item.(*RecordChallengeToken))
	return nil
}

func (rctc *RecordChallengeTokenCollection) GetItemFromPath(path, namespace string) BundleableItem {
	return NewBaseRecordChallengeToken(namespace, StandardNameFromPath(path))
}

func (rctc *RecordChallengeTokenCollection) GetItemFromKey(key string) (BundleableItem, error) {
	return NewRecordChallengeToken(key)
}

func (rctc *RecordChallengeTokenCollection) FilterPath(path string, conditions BundleConditions, definitionOnly bool) bool {
	return StandardPathFilter(path)
}

func (rctc *RecordChallengeTokenCollection) Loop(iter GroupIterator) error {
	for index, uat := range *rctc {
		err := iter(uat, strconv.Itoa(index))
		if err != nil {
			return err
		}
	}
	return nil
}

func (rctc *RecordChallengeTokenCollection) Len() int {
	return len(*rctc)
}
