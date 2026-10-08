"""One-time import of Toronto ground elevation for Rush's wider map.

    python3 -m venv /tmp/topo && /tmp/topo/bin/pip install numpy scipy
    npx tsx scripts/terrain/region-bounds.ts > /tmp/region.json
    /tmp/topo/bin/python scripts/terrain/import-region.py /tmp/region.json

Same source and method as src/data/terrain.json (the authored Queen East grid):
City of Toronto contours (cot_geospatial3 FeatureServer/8), Delaunay-linear
interpolation onto a regular grid, two 3x3 binomial smoothing passes. Heights
are metres above sea level; the game subtracts its own datum at runtime.
Writes src/data/terrain-region.json (heights in decimetres to keep it small).
"""
import json, math, sys, time, urllib.parse, urllib.request
import numpy as np
from scipy.interpolate import LinearNDInterpolator, NearestNDInterpolator

STEP = 20  # metres
SERVICE = 'https://gis.toronto.ca/arcgis/rest/services/cot_geospatial3/FeatureServer/8/query'
bounds = json.load(open(sys.argv[1]))
geo = json.load(open('src/data/geography.json'))['meta']
o, a = geo['origin'], geo['angle']
k = 111320 * math.cos(o[1] * math.pi / 180)

def project(lon, lat):
    e = (lon - o[0]) * k; n = (lat - o[1]) * 111320
    return e * math.cos(a) + n * math.sin(a), e * math.sin(a) - n * math.cos(a)

def unproject(x, z):
    e = x * math.cos(a) + z * math.sin(a); n = x * math.sin(a) - z * math.cos(a)
    return o[0] + e / k, o[1] + n / 111320

corners = [unproject(x, z) for x in (bounds['left'] - 300, bounds['right'] + 300) for z in (bounds['top'] - 300, bounds['bottom'] + 300)]
env = dict(xmin=min(c[0] for c in corners), ymin=min(c[1] for c in corners), xmax=max(c[0] for c in corners), ymax=max(c[1] for c in corners), spatialReference={'wkid': 4326})

xs, zs, hs = [], [], []
offset, features = 0, 0
while True:
    q = dict(where='1=1', outFields='ELEVATION', geometry=json.dumps(env), geometryType='esriGeometryEnvelope', inSR=4326, outSR=4326,
             spatialRel='esriSpatialRelIntersects', resultOffset=offset, resultRecordCount=2000, maxAllowableOffset=0.000005, f='json')
    for attempt in range(5):
        try:
            data = json.load(urllib.request.urlopen(SERVICE + '?' + urllib.parse.urlencode(q), timeout=120)); break
        except Exception as err:
            print('retry', err, file=sys.stderr); time.sleep(5 * (attempt + 1))
    else:
        sys.exit('City contour service unavailable')
    page = data.get('features', [])
    for f in page:
        h = f['attributes']['ELEVATION']
        for path in f['geometry'].get('paths', []):
            # densify to <= 10 m spacing so long straight contour runs still constrain the triangulation
            for (lon1, lat1), (lon2, lat2) in zip(path, path[1:] + path[-1:]):
                x1, z1 = project(lon1, lat1); x2, z2 = project(lon2, lat2)
                n = max(1, int(math.hypot(x2 - x1, z2 - z1) // 10))
                for t in range(n):
                    xs.append(x1 + (x2 - x1) * t / n); zs.append(z1 + (z2 - z1) * t / n); hs.append(h)
    features += len(page); offset += len(page)
    print(f'{features} contours, {len(xs)} vertices', file=sys.stderr)
    if not data.get('exceededTransferLimit') and len(page) < 2000: break

pts = np.column_stack([xs, zs]); vals = np.array(hs, dtype=float)
cols = int((bounds['right'] - bounds['left']) // STEP) + 1; rows = int((bounds['bottom'] - bounds['top']) // STEP) + 1
gx, gz = np.meshgrid(bounds['left'] + np.arange(cols) * STEP, bounds['top'] + np.arange(rows) * STEP)
grid = LinearNDInterpolator(pts, vals)(gx, gz)
holes = np.isnan(grid)
if holes.any():  # outside the contours' hull (e.g. over the lake): nearest contour
    grid[holes] = NearestNDInterpolator(pts, vals)(gx[holes], gz[holes])
kernel = np.array([[1, 2, 1], [2, 4, 2], [1, 2, 1]], dtype=float) / 16
for _ in range(2):
    p = np.pad(grid, 1, mode='edge')
    grid = sum(kernel[i, j] * p[i:i + rows, j:j + cols] for i in range(3) for j in range(3))
out = dict(meta=dict(source=SERVICE.rsplit('/query', 1)[0], licence='City of Toronto Open Data Licence',
                     method=f'Delaunay-linear interpolation of {features} mapped contours (densified to 10 m) on a {STEP} m grid, two 3x3 binomial smoothing passes; nearest contour outside their hull. Not a survey of curbs, decks or bridges.',
                     date=time.strftime('%Y-%m-%d'), units='decimetres above sea level', contours=features, sourceVertices=len(xs), outsideHullSamples=int(holes.sum())),
           left=bounds['left'], top=bounds['top'], step=STEP, cols=cols, rows=rows,
           heights=[int(round(v * 10)) for v in grid.ravel()])
json.dump(out, open('src/data/terrain-region.json', 'w'), separators=(',', ':'))
print(f'terrain-region.json: {cols}x{rows} @ {STEP} m, {features} contours, elevation {grid.min():.1f}..{grid.max():.1f} m', file=sys.stderr)
