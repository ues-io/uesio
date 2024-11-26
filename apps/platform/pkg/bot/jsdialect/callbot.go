package jsdialect

import (
	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func NewCallBotAPI(bot *meta.Bot, session *sess.Session, connection wire.Connection, params map[string]interface{}) *CallBotAPI {
	return &CallBotAPI{
		Session: session,
		Params: &ParamsAPI{
			Params: params,
		},
		AsAdmin: AsAdminApi{
			session:    session,
			connection: connection,
		},
		errors:     []string{},
		connection: connection,
		metadata:   &wire.MetadataCache{},
		bot:        bot,
		Results:    map[string]interface{}{},
		LogApi:     NewBotLogAPI(bot, session.Context()),
		Http:       NewBotHttpAPI(wire.NewIntegrationConnection(nil, nil, session, nil, connection)),
	}
}

type CallBotAPI struct {
	Session    *sess.Session
	Params     *ParamsAPI `bot:"params"`
	connection wire.Connection
	bot        *meta.Bot
	errors     []string
	metadata   *wire.MetadataCache
	Results    map[string]interface{}
	AsAdmin    AsAdminApi  `bot:"asAdmin"`
	LogApi     *BotLogAPI  `bot:"log"`
	Http       *BotHttpAPI `bot:"http"`
}

func (cba *CallBotAPI) AddError(message string) {
	cba.errors = append(cba.errors, message)
}

func (cba *CallBotAPI) GetErrors() []string {
	return cba.errors
}

func (cba *CallBotAPI) AddResult(key string, value interface{}) {
	cba.Results[key] = value
}

func (cba *CallBotAPI) Save(collection string, changes wire.Collection, options *wire.SaveOptions) (*wire.Collection, error) {
	return botSave(collection, changes, options, cba.Session, cba.connection, cba.metadata)
}

func (cba *CallBotAPI) Delete(collection string, deletes wire.Collection) error {
	return botDelete(collection, deletes, cba.Session, cba.connection, cba.metadata)
}

func (cba *CallBotAPI) Load(request BotLoadOp) (*wire.Collection, error) {
	return botLoad(request, cba.Session, cba.connection, cba.metadata)
}

func (cba *CallBotAPI) RunIntegrationAction(integrationID string, action string, options interface{}) (interface{}, error) {
	return runIntegrationAction(integrationID, action, options, cba.Session, cba.connection)
}

func (cba *CallBotAPI) CallBot(botKey string, params map[string]interface{}) (interface{}, error) {
	return botCall(botKey, params, cba.Session, cba.connection)
}

func (cba *CallBotAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValueFromKey(configValueKey, cba.Session)
}

func (cba *CallBotAPI) GetSession() *SessionAPI {
	return NewSessionAPI(cba.Session)
}

func (cba *CallBotAPI) GetUser() *UserAPI {
	return NewUserAPI(cba.Session.GetContextUser())
}

func (cba *CallBotAPI) GetNamespace() string {
	return cba.bot.GetNamespace()
}

func (cba *CallBotAPI) GetName() string {
	return cba.bot.Name
}

func (cba *CallBotAPI) CopyFile(sourceKey, sourcePath, destCollectionID, destRecordID, destFieldID string) error {
	return botCopyFile(sourceKey, sourcePath, destCollectionID, destRecordID, destFieldID, cba.Session, cba.connection)
}

func (cba *CallBotAPI) CopyUserFile(sourceFileID, destCollectionID, destRecordID, destFieldID string) error {
	return botCopyUserFile(sourceFileID, destCollectionID, destRecordID, destFieldID, cba.Session, cba.connection)
}

func (cba *CallBotAPI) GetFileContents(sourceKey, sourcePath string) (string, error) {
	return getFileContents(sourceKey, sourcePath, cba.Session, cba.connection)
}

func (cba *CallBotAPI) GetHostUrl() (string, error) {
	return getHostUrl(cba.Session, cba.connection)
}

func (cba *CallBotAPI) GetFileUrl(sourceKey, sourcePath string) string {
	return getFileUrl(sourceKey, sourcePath)
}

func (cba *CallBotAPI) MergeTemplate(templateString string, params map[string]interface{}) (string, error) {
	return mergeTemplateString(templateString, params)
}

func (cba *CallBotAPI) MergeTemplateFile(sourceKey, sourcePath string, params map[string]interface{}) (string, error) {
	return mergeTemplateFile(sourceKey, sourcePath, params, cba.Session, cba.connection)
}

func (cba *CallBotAPI) GetCollectionMetadata(collectionKey string) (*BotCollectionMetadata, error) {

	collectionMetadata, err := cba.metadata.GetCollection(collectionKey)
	if err != nil {
		return nil, err
	}
	return NewBotCollectionMetadata(collectionMetadata), nil
}
