package file

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

const CacheFor1Year = "private, no-transform, max-age=31536000, s-maxage=31536000"

func respondFile(w http.ResponseWriter, r *http.Request, fileRequest *FileRequest, stream io.ReadSeeker) {
	if stream == nil {
		w.WriteHeader(http.StatusNotFound)
		w.Header().Set("Content-Type", "application/json")
		resp := make(map[string]string)
		resp["message"] = "Resource Not Found"
		jsonResp, err := json.Marshal(resp)
		if err != nil {
			slog.Error(err.Error())
		}
		w.Write(jsonResp)
		return
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf("; filename=\"%s\"", fileRequest.Path))
	if fileRequest.TreatAsImmutable() {
		w.Header().Set("Cache-Control", CacheFor1Year)
	}

	http.ServeContent(w, r, fileRequest.Path, fileRequest.LastModified, stream)
	return

}

func ServeFileContent(file *meta.File, version string, w http.ResponseWriter, r *http.Request) {

	session := middleware.GetSession(r)
	connection, err := datasource.GetPlatformConnection(session, nil)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	if err := bundle.Load(file, nil, session, connection); err != nil {
		ctlutil.HandleError(w, err)
		return
	}
	buf := &bytes.Buffer{}
	fileMetadata, err := bundle.GetItemAttachment(buf, file, file.Path, session, connection)
	if err != nil {
		ctlutil.HandleError(w, err)
		return
	}

	// Ignore downloads that cannot be cached
	if r.URL.Path != "/favicon.ico" {
		usage.RegisterEvent("DOWNLOAD", "FILESOURCE", filesource.PLATFORM_FILE_SOURCE, 0, session)
		usage.RegisterEvent("DOWNLOAD_BYTES", "FILESOURCE", filesource.PLATFORM_FILE_SOURCE, fileMetadata.ContentLength(), session)
	}
	respondFile(w, r, &FileRequest{
		Path:         file.Path,
		LastModified: *fileMetadata.LastModified(),
		Namespace:    file.Namespace,
		Version:      version,
	}, bytes.NewReader(buf.Bytes()))
}

func ServeFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	file := meta.NewBaseFile(vars["namespace"], vars["name"])
	ServeFileContent(file, vars["version"], w, r)
}
