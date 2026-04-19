package pdffonts

import (
	_ "embed"

	"github.com/go-pdf/fpdf"
)

// DejaVu Sans Condensed из go-pdf/fpdf (лицензия Bitstream Vera / DejaVu).
//
//go:embed DejaVuSansCondensed.ttf
var dejaVuRegular []byte

//go:embed DejaVuSansCondensed-Bold.ttf
var dejaVuBold []byte

// Family — имя семейства шрифтов fpdf для SetFont.
const Family = "DejaVu"

// RegisterUTF8Fonts регистрирует Unicode TTF-шрифты. Срезы входных данных копируются, потому что
// fpdf может изменять байтовый буфер (см. go-pdf/fpdf#316).
func RegisterUTF8Fonts(pdf *fpdf.Fpdf) {
	reg := append([]byte(nil), dejaVuRegular...)
	bold := append([]byte(nil), dejaVuBold...)
	pdf.AddUTF8FontFromBytes(Family, "", reg)
	pdf.AddUTF8FontFromBytes(Family, "B", bold)
}
