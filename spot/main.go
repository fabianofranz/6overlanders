package main

import (
	"bufio"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"image/color"
	"io"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"time"

	"github.com/twpayne/go-kml"
	"github.com/twpayne/go-kml/icon"
)

const (
	csvDateTimeInputFormat  = "02-Jan-2006 15:04:05"
	jsonDateTimeInputFormat = "2006-01-02T15:04:05+0000"
	dateTimeOutputFormat    = "02/01/06"

	kindTrack   = "UNLIMITED-TRACK"
	kindCheckin = "CHECK-IN"
)

type entry struct {
	lat      float64
	lon      float64
	dateTime time.Time
	kind     string
}

func (e entry) String() string {
	return fmt.Sprintf("%v,%v,%v,%v", e.lat, e.lon, e.dateTime, e.kind)
}

type byDateTime []entry

func (s byDateTime) Len() int {
	return len(s)
}
func (s byDateTime) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}
func (s byDateTime) Less(i, j int) bool {
	return s[i].dateTime.Before(s[j].dateTime)
}

func uniques(entries []entry) []entry {
	keys := make(map[string]bool)
	s := []entry{}
	for _, e := range entries {
		if _, value := keys[e.String()]; !value {
			keys[e.String()] = true
			s = append(s, e)
		} else {
			fmt.Println("DUPE!")
		}
	}
	return s
}

func main() {
	entries := []entry{}

	files, err := filepath.Glob("./data/*.csv")
	if err != nil {
		log.Fatal(err)
	}

	if files != nil {
		for _, filename := range files {
			csvFile, _ := os.Open(filename)
			reader := csv.NewReader(bufio.NewReader(csvFile))

			for {
				line, err := reader.Read()
				if err == io.EOF {
					break
				} else if err != nil {
					log.Fatal(err)
				}

				latFloat, err := strconv.ParseFloat(line[0], 64)
				if err != nil {
					log.Fatal(err)
				}
				lonFloat, err := strconv.ParseFloat(line[1], 64)
				if err != nil {
					log.Fatal(err)
				}
				dateTime, err := time.Parse(csvDateTimeInputFormat, line[2])
				if err != nil {
					log.Fatal(err)
				}
				kind := line[3]

				entries = append(entries, entry{
					lat:      latFloat,
					lon:      lonFloat,
					dateTime: dateTime,
					kind:     kind,
				})
			}
		}
	}

	files, err = filepath.Glob("./data/*.json")
	if err != nil {
		log.Fatal(err)
	}

	if files != nil {
		for _, filename := range files {
			content, err := ioutil.ReadFile(filename)
			if err != nil {
				log.Fatal(err)
			}

			var raw interface{}
			var item map[string]interface{}
			var list []interface{}
			var ok bool

			err = json.Unmarshal(content, &raw)
			if err != nil {
				log.Fatal(err)
			}

			if item, ok = raw.(map[string]interface{}); ok {
				raw = item["response"]
				if item, ok = raw.(map[string]interface{}); ok {
					raw = item["feedMessageResponse"]
					if item, ok = raw.(map[string]interface{}); ok {
						raw = item["messages"]
						if item, ok = raw.(map[string]interface{}); ok {
							raw = item["message"]
							if list, ok = raw.([]interface{}); ok {
								for _, raw = range list {
									if item, ok = raw.(map[string]interface{}); ok {
										latFloat := item["latitude"].(float64)
										lonFloat := item["longitude"].(float64)
										dateTime, err := time.Parse(jsonDateTimeInputFormat, item["dateTime"].(string))
										if err != nil {
											log.Fatal(err)
										}
										kind := item["messageType"].(string)

										entries = append(entries, entry{
											lat:      latFloat,
											lon:      lonFloat,
											dateTime: dateTime,
											kind:     kind,
										})
									}
								}
							}
						}
					}
				}
			}

		}
	}

	entries = uniques(entries)
	sort.Sort(byDateTime(entries))

	document := kml.Document(
		kml.Name("6overlanders"),
		kml.SharedStyle(
			"specialStyle",
			kml.IconStyle(
				kml.Scale(0.75),
				kml.Icon(
					kml.Href(icon.ShapeHref("placemark_circle_highlight")),
				),
			),
		),
		kml.SharedStyle(
			"regularStyle",
			kml.LineStyle(
				kml.Color(color.RGBA{R: 255, G: 255, B: 0, A: 127}),
				kml.Width(4),
			),
			kml.PolyStyle(
				kml.Color(color.RGBA{R: 0, G: 255, B: 0, A: 127}),
			),
			kml.IconStyle(
				kml.Scale(0.75),
				kml.Icon(
					kml.Href(icon.ShapeHref("placemark_circle")),
				),
			),
		),
	)

	lineCoordinates := []kml.Coordinate{}

	for _, entry := range entries {
		coordinate := kml.Coordinate{
			Lat: entry.lat,
			Lon: entry.lon,
		}

		lineCoordinates = append(lineCoordinates, coordinate)

		switch entry.kind {
		case kindCheckin:
			placemark := kml.Placemark(
				kml.Name(entry.dateTime.Format(dateTimeOutputFormat)),
				kml.StyleURL("#regularStyle"),
				kml.Point(
					kml.Coordinates(coordinate),
				),
			)
			document.Add(placemark)
		}
	}

	if len(entries) > 0 {
		latestEntry := entries[len(entries)-1]
		placemark := kml.Placemark(
			kml.Name(latestEntry.dateTime.Format(dateTimeOutputFormat)),
			kml.StyleURL("#specialStyle"),
			kml.Point(
				kml.Coordinates(kml.Coordinate{
					Lat: latestEntry.lat,
					Lon: latestEntry.lon,
				}),
			),
		)
		document.Add(placemark)
	}

	lines := kml.Placemark(
		kml.Name("Trajeto"),
		kml.StyleURL("#regularStyle"),
		kml.LineString(
			kml.Tessellate(true),
			kml.AltitudeMode("clampToGround"),
			kml.Coordinates(lineCoordinates...),
		),
	)

	document.Add(lines)

	k := kml.KML(document)

	out, err := os.Create("../src/static/spot-data.kml")
	if err != nil {
		log.Fatal(err)
	}
	defer out.Close()

	if err := k.WriteIndent(out, "", "  "); err != nil {
		log.Fatal(err)
	}
}
