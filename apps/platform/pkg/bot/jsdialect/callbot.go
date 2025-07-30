package jsdialect

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func NewCallBotAPI(ctx context.Context, bot *meta.Bot, session *sess.Session, connection wire.Connection, params map[string]any) *CallBotAPI {
	return &CallBotAPI{
		Session: session,
		Params: &ParamsAPI{
			Params: params,
		},
		AsAdmin:    NewAsAdminAPI(ctx, session, connection),
		errors:     []string{},
		connection: connection,
		metadata:   &wire.MetadataCache{},
		bot:        bot,
		Results:    map[string]any{},
		LogApi:     NewBotLogAPI(ctx, bot),
		Http:       NewBotHttpAPI(ctx, wire.NewIntegrationConnection(nil, nil, session, nil, connection)),
		ctx:        ctx,
	}
}

type CallBotAPI struct {
	Session    *sess.Session
	Params     *ParamsAPI `bot:"params"`
	connection wire.Connection
	bot        *meta.Bot
	errors     []string
	metadata   *wire.MetadataCache
	// Intentionally maintaining a context here because this code is called from javascript so we have to keep track of the context
	// upon creation so we can use as the bot processes. This is an exception to the rule of avoiding keeping context in structs.
	ctx     context.Context
	Results map[string]any
	AsAdmin *AsAdminApi `bot:"asAdmin"`
	LogApi  *BotLogAPI  `bot:"log"`
	Http    *BotHttpAPI `bot:"http"`
}

func (cba *CallBotAPI) AddError(message string) {
	cba.errors = append(cba.errors, message)
}

func (cba *CallBotAPI) GetErrors() []string {
	return cba.errors
}

func (cba *CallBotAPI) AddResult(key string, value any) {
	cba.Results[key] = value
}

func (cba *CallBotAPI) Save(collection string, changes wire.Collection, options *wire.SaveOptions) (*wire.Collection, error) {
	return botSave(cba.ctx, collection, changes, options, cba.Session, cba.connection, cba.metadata)
}

func (cba *CallBotAPI) Delete(collection string, deletes wire.Collection) error {
	return botDelete(cba.ctx, collection, deletes, cba.Session, cba.connection, cba.metadata)
}

func (cba *CallBotAPI) Load(request BotLoadOp) (*wire.Collection, error) {
	return botLoad(cba.ctx, request, cba.Session, cba.connection, cba.metadata)
}

func (cba *CallBotAPI) RunIntegrationAction(integrationID string, action string, options any) (any, error) {
	return runIntegrationAction(cba.ctx, integrationID, action, options, cba.Session, cba.connection)
}

func (cba *CallBotAPI) CallBot(botKey string, params map[string]any) (any, error) {
	return botCall(cba.ctx, botKey, params, cba.Session, cba.connection)
}

func (cba *CallBotAPI) GetConfigValue(configValueKey string) (string, error) {
	return configstore.GetValue(cba.ctx, configValueKey, cba.Session)
}

func (cba *CallBotAPI) GetSession() *SessionAPI {
	return NewSessionAPI(cba.ctx, cba.Session)
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
	return botCopyFile(cba.ctx, sourceKey, sourcePath, destCollectionID, destRecordID, destFieldID, cba.Session, cba.connection)
}

func (cba *CallBotAPI) CopyUserFile(sourceFileID, destCollectionID, destRecordID, destFieldID string) error {
	return botCopyUserFile(cba.ctx, sourceFileID, destCollectionID, destRecordID, destFieldID, cba.Session, cba.connection)
}

func (cba *CallBotAPI) GetFileContents(sourceKey, sourcePath string) (string, error) {
	return getFileContents(cba.ctx, sourceKey, sourcePath, cba.Session, cba.connection)
}

func (cba *CallBotAPI) GetHostUrl() (string, error) {
	return getHostUrl(cba.ctx, cba.Session, cba.connection)
}

func (cba *CallBotAPI) GetFileUrl(sourceKey, sourcePath string) string {
	return getFileUrl(sourceKey, sourcePath)
}

func (cba *CallBotAPI) MergeTemplate(templateString string, params map[string]any) (string, error) {
	return mergeTemplateString(templateString, params)
}

func (cba *CallBotAPI) MergeTemplateFile(sourceKey, sourcePath string, params map[string]any) (string, error) {
	return mergeTemplateFile(cba.ctx, sourceKey, sourcePath, params, cba.Session, cba.connection)
}

func (cba *CallBotAPI) GetCollectionMetadata(collectionKey string) (*BotCollectionMetadata, error) {

	collectionMetadata, err := cba.metadata.GetCollection(collectionKey)
	if err != nil {
		return nil, err
	}
	return NewBotCollectionMetadata(collectionMetadata), nil
}
