package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"strings"
	"sync"

	"github.com/go-chi/httplog/v3"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

// logContextKey is the key for storing log data in the request context
type logDataContextKey struct{}

// logData stores session information that can be set by downstream middleware
// and accessed by the request logger.
type logData struct {
	mu      sync.RWMutex
	session *sess.Session
}

// SetSession safely sets the session in the log data
func (ld *logData) SetSession(session *sess.Session) {
	ld.mu.Lock()
	defer ld.mu.Unlock()
	ld.session = session
}

// GetSession safely gets the session from the log data
func (ld *logData) GetSession() *sess.Session {
	ld.mu.RLock()
	defer ld.mu.RUnlock()
	return ld.session
}

func RequestLogger(logger *slog.Logger, logFormat *httplog.Schema) func(next http.Handler) http.Handler {
	logHandler := httplog.RequestLogger(logger, defaultOptions(logFormat))
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := context.WithValue(r.Context(), logDataContextKey{}, &logData{})
			logHandler(next).ServeHTTP(w, r.WithContext(ctx))
		})
	}

}

func defaultOptions(logFormat *httplog.Schema) *httplog.Options {
	return &httplog.Options{
		Level:         slog.LevelInfo,
		Schema:        logFormat,
		RecoverPanics: true,
		LogAdditionalAttrs: &httplog.LogAdditionalAttrsOptions{
			AdditionalAttrs: func(details *httplog.LogDetails) []slog.Attr {
				additionalAttrs := make([]slog.Attr, 0, 2)
				if ld := getLogData(details.Request.Context()); ld != nil {
					if s := ld.GetSession(); s != nil {
						site := s.GetSite()
						sessionAttrs := make([]any, 0, 7)
						sessionAttrs = append(sessionAttrs,
							slog.String("userId", s.GetSiteUser().ID),
							slog.String("appId", site.App.ID),
							slog.String("siteId", site.ID),
							slog.String("site", site.GetAppFullName()+":"+site.Name),
						)
						w := s.GetWorkspace()
						if w != nil {
							sessionAttrs = append(sessionAttrs,
								slog.String("workspaceId", w.ID),
								slog.String("workspace", w.GetAppFullName()+":"+w.Name),
							)
						}

						additionalAttrs = append(additionalAttrs, slog.Group("session", sessionAttrs...))

						usage.RegisterEvent(details.Request.Method, "REQUEST_COUNT", "ALL", 1, s)
						if details.RequestBytesRead > 0 {
							usage.RegisterEvent("INGRESS_BYTES", "DATA_TRANSFER", "ALL", details.RequestBytesRead, s)
						}
						if details.ResponseBytes > 0 {
							usage.RegisterEvent("EGRESS_BYTES", "DATA_TRANSFER", "ALL", int64(details.ResponseBytes), s)
						}
					}
				}

				additionalAttrs = append(additionalAttrs,
					// TODO: getRemoteIP has limitations (see https://github.com/ues-io/uesio/issues/4951). FOr now, rather than modify the request.RemoteAddr value
					// we'll just override the value that httplog from RemoteAddr for logging purposes.  When #4951 is resolved, RemoteAddr should be set to the actual
					// client address and then this override can be removed.
					slog.String(logFormat.RequestRemoteIP, getRemoteIp(details.Request)),
				)

				return additionalAttrs
			},
		},
	}
}

// Request.RemoteAddress contains port, which we want to remove i.e.:
// "[::1]:58292" => "[::1]"
func ipAddrFromRemoteAddr(s string) string {
	idx := strings.LastIndex(s, ":")
	if idx == -1 {
		return s
	}
	return s[:idx]
}

// getRemoteIp returns ip address of the client making the request,
// taking into account http proxies
// TODO: The approach to obtain the client IP is not reliable and needs to be improved.  See https://github.com/ues-io/uesio/issues/4951
func getRemoteIp(r *http.Request) string {
	hdr := r.Header
	hdrRealIP := hdr.Get("X-Real-Ip")
	hdrForwardedFor := hdr.Get("X-Forwarded-For")
	if hdrRealIP == "" && hdrForwardedFor == "" {
		return ipAddrFromRemoteAddr(r.RemoteAddr)
	}
	if hdrForwardedFor != "" {
		// X-Forwarded-For is potentially a list of addresses separated with ","
		parts := strings.Split(hdrForwardedFor, ",")
		for i, p := range parts {
			parts[i] = strings.TrimSpace(p)
		}
		// TODO: should return first non-local address
		return parts[0]
	}
	return hdrRealIP
}
