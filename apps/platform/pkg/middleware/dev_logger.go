package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"log/slog"
	"time"

	"github.com/fatih/color"
)

// DevLogHandler provides a colored textual log handler
// for use in local development
type DevLogHandler struct {
	slog.Handler
	l *log.Logger
}

func (h *DevLogHandler) Handle(ctx context.Context, r slog.Record) error {
	level := r.Level.String() + ":"

	color.NoColor = false

	var colorFunc func(string, ...interface{}) string

	switch r.Level {
	case slog.LevelInfo:
		colorFunc = color.BlueString
	case slog.LevelWarn:
		colorFunc = color.YellowString
	case slog.LevelError:
		colorFunc = color.RedString
	default:
		colorFunc = color.MagentaString
	}
	level = colorFunc(level)
	msg := colorFunc(r.Message)

	fields := map[string]interface{}{}

	r.Attrs(func(a slog.Attr) bool {
		// Assuming a single level here
		if a.Value.Kind() == slog.KindGroup {
			groupVal := map[string]interface{}{}
			for _, v := range a.Value.Group() {
				groupVal[v.Key] = v.Value.Any()
			}
			fields[a.Key] = groupVal
		} else {
			fields[a.Key] = a.Value.Any()
		}
		return true
	})

	timeStr := r.Time.Format("[15:05:05.000]")
	var siteKey, user string
	if fields["app"] != nil {
		app := fields["app"].(string)
		site := fields["site"].(string)
		user = color.MagentaString(fields["user"].(string))
		siteKey = color.CyanString(fmt.Sprintf("%s:%s", site, app))
		delete(fields, "user")
		delete(fields, "app")
		delete(fields, "site")
	}

	// If this is the "per-request" log, use a specific formatter
	if fields["stats"] != nil && fields["request"] != nil {
		requestObject := fields["request"].(map[string]interface{})
		statsObject := fields["stats"].(map[string]interface{})
		size := color.BlueString(byteCountDecimal(statsObject["size"].(int64)))
		duration := statsObject["duration"].(time.Duration).Round(time.Millisecond)
		path := colorFunc(requestObject["path"].(string))
		method := colorFunc(requestObject["method"].(string))
		code := colorFunc(fmt.Sprintf("%d", int(statsObject["code"].(int64))))
		h.l.Printf("%v %-4s %-32s %s %5s %16s %s %s\n", timeStr, method, path, code, duration, size, siteKey, user)
	} else {
		var fieldsString string
		if len(fields) > 0 {
			if fieldsBytes, err := json.MarshalIndent(fields, "", "  "); err == nil && len(fieldsBytes) > 0 {
				fieldsString = color.HiMagentaString(string(fieldsBytes))
			}
		}
		h.l.Printf("%v %-4s %s %s %s\n", timeStr, msg, siteKey, user, fieldsString)
	}
	return nil
}

func NewDevLogHandler(
	out io.Writer,
	opts *slog.HandlerOptions,
) *DevLogHandler {
	return &DevLogHandler{
		Handler: slog.NewTextHandler(out, opts),
		l:       log.New(out, "", 0),
	}
}

func byteCountDecimal(b int64) string {
	const unit = 1000
	if b < unit {
		return fmt.Sprintf("%dB", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f%cB", float64(b)/float64(div), "kMGTPE"[exp])
}
