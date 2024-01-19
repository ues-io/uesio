package systemdialect

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/bot"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func getKeyBotInfo(change *wire.ChangeItem) (botName, botType, botDialect string, err error) {
	botName, err = change.GetFieldAsString("uesio/studio.name")
	if err != nil {
		return "", "", "", err
	}
	botDialect, err = change.GetFieldAsString("uesio/studio.dialect")
	if err != nil {
		return "", "", "", err
	}
	botType, err = change.GetFieldAsString("uesio/studio.type")
	if err != nil {
		return "", "", "", err
	}
	return botName, botType, botDialect, nil
}

func runBotAfterSaveBot(request *wire.SaveOp, connection wire.Connection, session *sess.Session) error {

	var fileUploadOps []*filesource.FileUploadOp
	botCollection := meta.BotCollection{}

	// Pre-create an Attachment file for the new Bot's contents
	var err = request.LoopInserts(func(change *wire.ChangeItem) error {
		botName, botType, botDialect, err := getKeyBotInfo(change)
		if err != nil {
			return err
		}
		// Lookup the BotDialect object
		dialectObject, err := bot.GetBotDialect(botDialect)
		if err != nil {
			return err
		}
		defaultText := dialectObject.GetDefaultFileBody(botType)
		if defaultText != "" {
			defaultText = fmt.Sprintf(defaultText, botName)
		}

		newFileUpload := filesource.FileUploadOp{
			Data:          strings.NewReader(defaultText),
			ContentLength: int64(len(defaultText)),
			Path:          dialectObject.GetFilePath(),
			CollectionID:  "uesio/studio.bot",
			RecordID:      change.IDValue,
		}

		fileUploadOps = append(fileUploadOps, &newFileUpload)

		return nil
	})
	if err != nil {
		return err
	}

	// For ALL TypeScript Bot changes, re-generate a types definition file for the Bot
	// if the Bot types have changed
	// attached via the "bottypes" field
	err = request.LoopChanges(func(change *wire.ChangeItem) error {
		// If we have Params in the changes, then we need to regenerate types,
		// otherwise there's nothing to do.
		if !change.HasFieldChanges("uesio/studio.params") {
			return nil
		}
		botDialect, err := change.GetFieldAsString("uesio/studio.dialect")
		if err != nil {
			return err
		}
		if err != nil {
			return err
		}
		botInstance := botCollection.NewItemFromUniqueKey(change.UniqueKey).(*meta.Bot)
		botInstance.Dialect = botDialect
		params, err := change.GetField("uesio/studio.params")
		if err != nil {
			return err
		}
		bytes, err := json.Marshal(params)
		if err != nil {
			return err
		}
		var botParams meta.BotParams
		err = json.Unmarshal(bytes, &botParams)
		if err != nil {
			return err
		}
		botInstance.Params = botParams
		botTypeDefinitions, err := botInstance.GenerateTypeDefinitions()
		if err != nil {
			return err
		}
		if botTypeDefinitions == "" {
			return nil
		}

		newFileUpload := filesource.FileUploadOp{
			Data:          strings.NewReader(botTypeDefinitions),
			ContentLength: int64(len(botTypeDefinitions)),
			CollectionID:  "uesio/studio.bot",
			RecordID:      change.IDValue,
			FieldID:       "uesio/studio.type_definitions",
			Params:        request.Params,
		}

		fileUploadOps = append(fileUploadOps, &newFileUpload)

		return nil
	})
	if err != nil {
		return err
	}

	// Upload all files, if there are any
	if len(fileUploadOps) == 0 {
		return nil
	}

	_, err = filesource.Upload(fileUploadOps, connection, session, request.Params)
	if err != nil {
		return err
	}

	return nil

}
