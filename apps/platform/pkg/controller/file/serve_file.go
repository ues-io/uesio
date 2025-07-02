package file

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"path/filepath"
	"time"
	"unicode"

	"github.com/gorilla/mux"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/controller/ctlutil"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/middleware"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

var unsafeChars = initUnsafeChars()

const separatorStr = string(filepath.Separator)

func respondFile(w http.ResponseWriter, r *http.Request, path string, modified time.Time, stream io.ReadSeeker) {
	if stream == nil {
		resp := make(map[string]string)
		resp["message"] = "Resource Not Found"
		jsonResp, err := json.Marshal(resp)
		if err != nil {
			slog.ErrorContext(r.Context(), err.Error())
			ctlutil.HandleError(r.Context(), w, err)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		// writeheader must come after setting other headers
		w.WriteHeader(http.StatusNotFound)
		w.Write(jsonResp)
		return
	}

	filename := filepath.Base(path)
	if filename == "." || filename == separatorStr || filename == "" {
		filename = ""
	} else {
		setContentDispositionHeader(w, filename)
	}

	http.ServeContent(w, r, filename, modified, stream)
}

func ServeFileContent(file *meta.File, path string, supportsCaching bool, w http.ResponseWriter, r *http.Request) {
	session := middleware.GetSession(r)
	connection, err := datasource.GetPlatformConnection(session, nil)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	if err := bundle.Load(file, nil, session, connection); err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}

	if path == "" {
		path = file.Path
	}

	rs, fileMetadata, err := bundle.GetItemAttachment(file, path, session, connection)
	if err != nil {
		ctlutil.HandleError(r.Context(), w, err)
		return
	}
	defer rs.Close()

	usage.RegisterEvent("DOWNLOAD", "FILESOURCE", filesource.PLATFORM_FILE_SOURCE, 0, session)
	usage.RegisterEvent("DOWNLOAD_BYTES", "FILESOURCE", filesource.PLATFORM_FILE_SOURCE, fileMetadata.ContentLength(), session)

	if supportsCaching {
		middleware.Set1YearCache(w)
	}

	respondFile(w, r, path, fileMetadata.LastModified(), rs)
}

func ServeFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	file := meta.NewBaseFile(vars["namespace"], vars["name"])
	path := vars["path"]
	ServeFileContent(file, path, true, w, r)
}

// setContentDispositionHeader sets the Content-Disposition header for modern browsers
func setContentDispositionHeader(w http.ResponseWriter, filename string) {
	// TODO: Previous code did not specify a disposition type so it would be browser dependent
	// but most default to inline when not specified so for backwards compatibility properly
	// setting the header value (not having a type is an invalid header value). This should
	// be evaluated to ensure inline is the default we want even if it will break some backwards
	// compat scenarios if we change to attachment instead. The file component could offer
	// it as a property and then we could dynamically set it based on that setting but beyond
	// that we have non-user types of files that go through this path as well. In short,
	// being explicit here to correct the invalid header value but more thought is needed
	// on this.
	dispositionType := "inline"
	if needsRFC5987Encoding(filename) {
		// Modern browsers only - use RFC 5987 encoding for non-ASCII
		encoded := url.PathEscape(filename)
		w.Header().Set("Content-Disposition", fmt.Sprintf("%s; filename*=UTF-8''%s", dispositionType, encoded))
	} else {
		// ASCII-only file - sanitize and use standard format
		sanitized := sanitizeAsciiFilename(filename)
		w.Header().Set("Content-Disposition", fmt.Sprintf("%s; filename=\"%s\"", dispositionType, sanitized))
	}
}

func initUnsafeChars() [128]bool {
	var chars [128]bool

	// Mark control characters as unsafe (0-31)
	for i := 0; i < 32; i++ {
		chars[i] = true
	}

	// Mark DEL character as unsafe
	chars[127] = true

	// Mark specific punctuation as unsafe
	chars['"'] = true
	chars['\\'] = true
	chars['/'] = true

	return chars
}

// sanitizeFilename removes dangerous characters from filenames for Content-Disposition headers
func sanitizeAsciiFilename(filename string) string {
	// Fast path: check if sanitization is needed
	needsSanitization := false
	for i := 0; i < len(filename); i++ {
		if filename[i] <= unicode.MaxASCII && unsafeChars[filename[i]] {
			needsSanitization = true
			break
		}
	}

	if !needsSanitization {
		return filename
	}

	// sanitize the string
	result := make([]byte, len(filename))
	for i := 0; i < len(filename); i++ {
		b := filename[i]
		if filename[i] <= unicode.MaxASCII && unsafeChars[filename[i]] {
			result[i] = '_'
		} else {
			result[i] = b
		}
	}
	return string(result)
}

// checks if filename contains non-ASCII characters
func needsRFC5987Encoding(filename string) bool {
	for i := 0; i < len(filename); i++ {
		if filename[i] > unicode.MaxASCII {
			return true
		}
	}
	return false
}
