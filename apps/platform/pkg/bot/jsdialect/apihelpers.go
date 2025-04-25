package jsdialect

import (
	"bytes"
	"errors"
	"io"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func botSave(collection string, changes wire.Collection, options *wire.SaveOptions, session *sess.Session, connection wire.Connection, metadata *wire.MetadataCache) (*wire.Collection, error) {
	requests := []datasource.SaveRequest{
		{
			Collection: collection,
			Wire:       "botsave",
			Changes:    &changes,
			Options:    options,
		},
	}
	err := datasource.SaveWithOptions(requests, session, datasource.NewSaveOptions(connection, metadata))
	err = datasource.HandleSaveRequestErrors(requests, err)
	if err != nil {
		return nil, err
	}
	return &changes, nil
}

func botDelete(collection string, deletes wire.Collection, session *sess.Session, connection wire.Connection, metadata *wire.MetadataCache) error {
	requests := []datasource.SaveRequest{
		{
			Collection: collection,
			Wire:       "botsave",
			Deletes:    &deletes,
		},
	}
	err := datasource.SaveWithOptions(requests, session, datasource.NewSaveOptions(connection, metadata))
	return datasource.HandleSaveRequestErrors(requests, err)
}

func botLoad(request BotLoadOp, session *sess.Session, connection wire.Connection, metadata *wire.MetadataCache) (*wire.Collection, error) {
	collection := &wire.Collection{}

	op := &wire.LoadOp{
		BatchSize:      request.BatchSize,
		CollectionName: request.Collection,
		Collection:     collection,
		WireName:       "botload",
		Fields:         request.Fields,
		Conditions:     request.Conditions,
		Order:          request.Order,
		Query:          true,
		LoadAll:        request.LoadAll,
	}

	err := datasource.LoadWithError(op, session, &datasource.LoadOptions{
		Connection: connection,
		Metadata:   metadata,
	})
	if err != nil {
		return nil, err
	}

	return collection, nil
}

func runIntegrationAction(integrationID string, action string, options any, session *sess.Session, connection wire.Connection) (any, error) {
	ic, err := datasource.GetIntegrationConnection(integrationID, session, connection)
	if err != nil {
		return nil, err
	}
	return datasource.RunIntegrationAction(ic, action, options, connection)
}

func botCall(botKey string, params map[string]any, session *sess.Session, connection wire.Connection) (map[string]any, error) {
	botNamespace, botName, err := meta.ParseKeyWithDefault(botKey, session.GetContextAppName())
	if err != nil {
		return nil, errors.New("invalid bot name provided")
	}
	return datasource.CallListenerBot(botNamespace, botName, params, connection, session)
}

func botGetFileData(sourceKey, sourcePath string, session *sess.Session, connection wire.Connection) (*bytes.Buffer, string, error) {

	file, err := meta.NewFile(sourceKey)
	if err != nil {
		return nil, "", err
	}

	if err := bundle.Load(file, nil, session, connection); err != nil {
		return nil, "", err
	}

	path := sourcePath
	if path == "" {
		path = file.Path
	}

	buf := &bytes.Buffer{}
	_, err = bundle.GetItemAttachment(buf, file, path, session, connection)
	if err != nil {
		return nil, "", err
	}
	return buf, path, nil
}

func botCopyFile(sourceKey, sourcePath, destCollectionID, destRecordID, destFieldID string, session *sess.Session, connection wire.Connection) error {

	buf, path, err := botGetFileData(sourceKey, sourcePath, session, connection)
	if err != nil {
		return err
	}

	_, err = filesource.Upload([]*filesource.FileUploadOp{
		{
			Data:         buf,
			Path:         path,
			CollectionID: destCollectionID,
			RecordID:     destRecordID,
			FieldID:      destFieldID,
		},
	}, connection, session, nil)

	return err
}

func botCopyUserFile(sourceFileID, destCollectionID, destRecordID, destFieldID string, session *sess.Session, connection wire.Connection) error {
	buf := &bytes.Buffer{}
	userFileMetadata, err := filesource.Download(buf, sourceFileID, session)
	if err != nil {
		return err
	}

	_, err = filesource.Upload([]*filesource.FileUploadOp{
		{
			Data:         buf,
			Path:         userFileMetadata.Path(),
			CollectionID: destCollectionID,
			RecordID:     destRecordID,
			FieldID:      destFieldID,
		},
	}, connection, session, nil)

	return err
}

func getFileContents(sourceKey, sourcePath string, session *sess.Session, connection wire.Connection) (string, error) {
	buf, _, err := botGetFileData(sourceKey, sourcePath, session, connection)
	if err != nil {
		return "", err
	}
	return buf.String(), nil
}

func getHostUrl(session *sess.Session, connection wire.Connection) (string, error) {
	site := session.GetSite()

	domain, err := datasource.QueryDomainFromSite(site.ID, connection)
	if err != nil {
		return "", err
	}

	return datasource.GetHostFromDomain(domain, site), nil
}

func getFileUrl(sourceKey, sourcePath string) string {
	namespace, name, err := meta.ParseKey(sourceKey)
	if err != nil {
		return ""
	}
	usePath := ""
	if sourcePath != "" {
		usePath = "/" + sourcePath
	}
	return "/site/files/" + namespace + "/" + name + usePath
}

func mergeTemplate(file io.Writer, params map[string]any, templateString string) error {
	template, err := templating.NewTemplateWithValidKeysOnly(templateString)
	if err != nil {
		return err
	}
	return template.Execute(file, params)
}

func mergeTemplateString(templateString string, params map[string]any) (string, error) {
	// Create a buffer to store the output
	var buf bytes.Buffer
	err := mergeTemplate(&buf, params, templateString)
	if err != nil {
		return "", err
	}
	return buf.String(), nil
}

func mergeTemplateFile(sourceKey, sourcePath string, params map[string]any, session *sess.Session, connection wire.Connection) (string, error) {
	templateString, err := getFileContents(sourceKey, sourcePath, session, connection)
	if err != nil {
		return "", err
	}
	template, err := templating.NewTemplateWithValidKeysOnly(templateString)
	if err != nil {
		return "", err
	}
	// Create a buffer to store the output
	var buf bytes.Buffer
	err = template.Execute(&buf, params)
	if err != nil {
		return "", err
	}
	return buf.String(), nil
}
