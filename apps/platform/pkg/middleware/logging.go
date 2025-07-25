package middleware

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"sync"

	"github.com/go-chi/chi/v5/middleware"
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

			ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
			var br *countingReader
			if r.Body != nil && r.Body != http.NoBody {
				br = &countingReader{reader: r.Body}
				r.Body = br
			}

			defer func() {
				// Need to track usage separate from logging LogAdditionalAttrs hook
				// because not all requests will be logged based on log level &
				// other logging options (e.g., Skip).
				if ld := getLogData(ctx); ld != nil {
					if s := ld.GetSession(); s != nil {
						usage.RegisterEvent("REQUEST_COUNT", "REQUEST", "ALL", 1, s)
						ingressBytes := computeApproximateRequestSize(r, br)
						if ingressBytes > 0 {
							usage.RegisterEvent("INGRESS_BYTES", "DATA_TRANSFER", "ALL", ingressBytes, s)
						}
						if ww.BytesWritten() > 0 {
							usage.RegisterEvent("EGRESS_BYTES", "DATA_TRANSFER", "ALL", int64(ww.BytesWritten()), s)
						}
					}
				}
			}()

			logHandler(next).ServeHTTP(ww, r.WithContext(ctx))
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
					}
				}

				additionalAttrs = append(additionalAttrs,
					// TODO: getRemoteIP has limitations (see https://github.com/ues-io/uesio/issues/4951). For now, rather than modify the request.RemoteAddr value
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

// Calculates request size similar how Prometheus (see https://github.com/prometheus/client_golang/blob/b0ace3d127a015aa24191b3d0f73d976fc07494c/prometheus/promhttp/instrument_server.go#L409)
// captures it. The approach is nearly identical but instead of using ContentLength, we use the actual bytes read when available in addition to URL, method, proto, headers, and host.
func computeApproximateRequestSize(r *http.Request, bodyReader *countingReader) int64 {
	var s int64
	if r.URL != nil {
		s += int64(len(r.URL.String()))
	}

	s += int64(len(r.Method))
	s += int64(len(r.Proto))
	for name, values := range r.Header {
		s += int64(len(name))
		for _, value := range values {
			s += int64(len(value))
		}
	}
	s += int64(len(r.Host))

	// Add content length if available
	if bodyReader == nil {
		if r.ContentLength > 0 {
			s += r.ContentLength
		}
	} else {
		s += bodyReader.bytesRead
	}

	return s
}

type countingReader struct {
	reader    io.ReadCloser
	bytesRead int64
}

func (cr *countingReader) Read(p []byte) (int, error) {
	n, err := cr.reader.Read(p)
	cr.bytesRead += int64(n)
	return n, err
}

func (cr *countingReader) Close() error {
	return cr.reader.Close()
}
