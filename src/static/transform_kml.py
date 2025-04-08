import json
import xml.etree.ElementTree as ET
from datetime import datetime

# Paths
INPUT_JSON = "locations.json"
OUTPUT_KML = "argentina-2024.kml"

# Load and sort JSON data by timestamp
with open(INPUT_JSON, "r", encoding="utf-8") as f:
    locations = json.load(f)["locations"]

sorted_locations = sorted(locations, key=lambda x: x["time"])

linestring_placemarks = []

# Create KML root structure
kml_ns = "http://www.opengis.net/kml/2.2"
ET.register_namespace("", kml_ns)
kml = ET.Element("{http://www.opengis.net/kml/2.2}kml")
document = ET.SubElement(kml, "Document")

# Track names to filter duplicates
seen_names = set()

# Add unique Placemarks
for loc in sorted_locations:
    start_date = datetime.strptime("2024-08-09 00:00:00", "%Y-%m-%d %H:%M:%S")
    end_date = datetime.strptime("2024-09-19 23:59:59", "%Y-%m-%d %H:%M:%S")

    timestamp_date = datetime.fromtimestamp(loc["time"])
    
    if timestamp_date < start_date:
        continue
    
    if timestamp_date > end_date:
        continue
    
    timestamp = timestamp_date.strftime("%d/%m/%y")
    name = timestamp

    linestring_placemarks.append(loc)

    if name in seen_names:
       continue
    seen_names.add(name)
    
    placemark = ET.SubElement(document, "Placemark")
    ET.SubElement(placemark, "name").text = name
    ET.SubElement(placemark, "styleUrl").text = "#regularStyle2"
    point = ET.SubElement(placemark, "Point")
    ET.SubElement(point, "coordinates").text = f"{loc['lon']},{loc['lat']}"

# Create LineString Placemark for the path
path_placemark = ET.SubElement(document, "Placemark")
ET.SubElement(path_placemark, "name").text = "Trajeto"
ET.SubElement(path_placemark, "styleUrl").text = "#regularStyle2"
line_string = ET.SubElement(path_placemark, "LineString")
ET.SubElement(line_string, "tessellate").text = "1"
ET.SubElement(line_string, "altitudeMode").text = "clampToGround"

ordered_coords = [f"{loc['lon']},{loc['lat']}" for loc in linestring_placemarks]
ET.SubElement(line_string, "coordinates").text = " ".join(ordered_coords)

# Write to KML file
tree = ET.ElementTree(kml)
tree.write(OUTPUT_KML, encoding="UTF-8", xml_declaration=True)
print(f"KML generated and saved as {OUTPUT_KML}")

