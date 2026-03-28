package pdffonts

import (
	_ "embed"

	"github.com/go-pdf/fpdf"
)

// DejaVu Sans Condensed from go-pdf/fpdf (Bitstream Vera / DejaVu license).
//
//go:embed DejaVuSansCondensed.ttf
var dejaVuRegular []byte

//go:embed DejaVuSansCondensed-Bold.ttf
var dejaVuBold []byte

// Family is the fpdf font family name for SetFont.
const Family = "DejaVu"

// RegisterUTF8Fonts registers Unicode TTF fonts. Input slices are copied because
// fpdf may mutate the byte buffer (see go-pdf/fpdf#316).
func RegisterUTF8Fonts(pdf *fpdf.Fpdf) {
	reg := append([]byte(nil), dejaVuRegular...)
	bold := append([]byte(nil), dejaVuBold...)
	pdf.AddUTF8FontFromBytes(Family, "", reg)
	pdf.AddUTF8FontFromBytes(Family, "B", bold)
}
