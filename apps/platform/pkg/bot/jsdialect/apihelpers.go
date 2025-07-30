package jsdialect

import (
	"bytes"
	"context"
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

func botSave(ctx context.Context, collection string, changes wire.Collection, options *wire.SaveOptions, session *sess.Session, connection wire.Connection, metadata *wire.MetadataCache) (*wire.Collection, error) {
	requests := []datasource.SaveRequest{
		{
			Collection: collection,
			Wire:       "botsave",
			Changes:    &changes,
			Options:    options,
		},
	}
	err := datasource.SaveWithOptions(ctx, requests, session, datasource.NewSaveOptions(connection, metadata))
	err = datasource.HandleSaveRequestErrors(requests, err)
	if err != nil {
		return nil, err
	}
	return &changes, nil
}

func botDelete(ctx context.Context, collection string, deletes wire.Collection, session *sess.Session, connection wire.Connection, metadata *wire.MetadataCache) error {
	requests := []datasource.SaveRequest{
		{
			Collection: collection,
			Wire:       "botsave",
			Deletes:    &deletes,
		},
	}
	err := datasource.SaveWithOptions(ctx, requests, session, datasource.NewSaveOptions(connection, metadata))
	return datasource.HandleSaveRequestErrors(requests, err)
}

func botLoad(ctx context.Context, request BotLoadOp, session *sess.Session, connection wire.Connection, metadata *wire.MetadataCache) (*wire.Collection, error) {
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

	err := datasource.LoadWithError(ctx, op, session, &datasource.LoadOptions{
		Connection: connection,
		Metadata:   metadata,
	})
	if err != nil {
		return nil, err
	}

	return collection, nil
}

func runIntegrationAction(ctx context.Context, integrationID string, action string, options any, session *sess.Session, connection wire.Connection) (any, error) {
	ic, err := datasource.GetIntegrationConnection(ctx, integrationID, session, connection)
	if err != nil {
		return nil, err
	}
	return datasource.RunIntegrationAction(ctx, ic, action, options, connection)
}

func botCall(ctx context.Context, botKey string, params map[string]any, session *sess.Session, connection wire.Connection) (map[string]any, error) {
	botNamespace, botName, err := meta.ParseKeyWithDefault(botKey, session.GetContextAppName())
	if err != nil {
		return nil, errors.New("invalid bot name provided")
	}
	return datasource.CallListenerBot(ctx, botNamespace, botName, params, connection, session)
}

func botGetFileData(ctx context.Context, sourceKey, sourcePath string, session *sess.Session, connection wire.Connection) (io.ReadSeekCloser, string, error) {

	file, err := meta.NewFile(sourceKey)
	if err != nil {
		return nil, "", err
	}

	if err := bundle.Load(ctx, file, nil, session, connection); err != nil {
		return nil, "", err
	}

	path := sourcePath
	if path == "" {
		path = file.Path
	}

	r, _, err := bundle.GetItemAttachment(ctx, file, path, session, connection)
	if err != nil {
		return nil, "", err
	}
	return r, path, nil
}

func botCopyFile(ctx context.Context, sourceKey, sourcePath, destCollectionID, destRecordID, destFieldID string, session *sess.Session, connection wire.Connection) error {

	r, path, err := botGetFileData(ctx, sourceKey, sourcePath, session, connection)
	if err != nil {
		return err
	}
	defer r.Close()

	_, err = filesource.Upload(ctx, []*filesource.FileUploadOp{
		{
			Data:         r,
			Path:         path,
			CollectionID: destCollectionID,
			RecordID:     destRecordID,
			FieldID:      destFieldID,
		},
	}, connection, session, nil)

	return err
}

func botCopyUserFile(ctx context.Context, sourceFileID, destCollectionID, destRecordID, destFieldID string, session *sess.Session, connection wire.Connection) error {
	r, userFileMetadata, err := filesource.Download(ctx, sourceFileID, session)
	if err != nil {
		return err
	}
	defer r.Close()

	_, err = filesource.Upload(ctx, []*filesource.FileUploadOp{
		{
			Data:         r,
			Path:         userFileMetadata.Path(),
			CollectionID: destCollectionID,
			RecordID:     destRecordID,
			FieldID:      destFieldID,
		},
	}, connection, session, nil)

	return err
}

func getFileContents(ctx context.Context, sourceKey, sourcePath string, session *sess.Session, connection wire.Connection) (string, error) {
	r, _, err := botGetFileData(ctx, sourceKey, sourcePath, session, connection)
	if err != nil {
		return "", err
	}
	defer r.Close()

	b, err := io.ReadAll(r)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func getHostUrl(ctx context.Context, session *sess.Session, connection wire.Connection) (string, error) {
	site := session.GetSite()

	domain, err := datasource.QueryDomainFromSite(ctx, site.ID, connection)
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

func mergeTemplateFile(ctx context.Context, sourceKey, sourcePath string, params map[string]any, session *sess.Session, connection wire.Connection) (string, error) {
	templateString, err := getFileContents(ctx, sourceKey, sourcePath, session, connection)
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
