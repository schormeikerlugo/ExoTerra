import csv, json, urllib.request, urllib.error, sys, time

SUPABASE_URL = "https://qjamwmvpmxicbonowcxd.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqYW13bXZwbXhpY2Jvbm93Y3hkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjExODI0NSwiZXhwIjoyMDkxNjk0MjQ1fQ.tF_mXaNc1DpxOdjOUqffz4ehr0CM9LrdRpR_57TVLU8"

float_fields = ['pl_bmasse','pl_rade','pl_dens','pl_bmassj','pl_radj','pl_orbper','pl_orbsmax',
                'pl_orbeccen','pl_orbincl','pl_eqt','pl_insol','st_teff','st_rad','st_mass',
                'st_lum','st_age','st_met','ra','dec','sy_dist']
int_fields = ['disc_year']

def parse_row(row):
    record = {}
    for k, v in row.items():
        if v == '' or v is None:
            record[k] = None
        elif k in float_fields:
            try: record[k] = float(v)
            except: record[k] = None
        elif k in int_fields:
            try: record[k] = int(v)
            except: record[k] = None
        else:
            record[k] = v.strip('"') if isinstance(v, str) else v
    record['pl_masse'] = record.pop('pl_bmasse', None)
    record['pl_bmasse'] = record.get('pl_bmassj', None)
    return record

rows = []
with open(sys.argv[1], 'r') as f:
    for row in csv.DictReader(f):
        rows.append(parse_row(row))

print(f"Parsed {len(rows)} exoplanets")

batch_size = 50
total = 0
errors = 0
for i in range(0, len(rows), batch_size):
    batch = rows[i:i+batch_size]
    data = json.dumps(batch).encode('utf-8')
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/exoplanets",
        data=data,
        headers={
            'apikey': SERVICE_KEY,
            'Authorization': f'Bearer {SERVICE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'resolution=ignore-duplicates'
        },
        method='POST'
    )
    for attempt in range(3):
        try:
            resp = urllib.request.urlopen(req, timeout=30)
            total += len(batch)
            if (i // batch_size) % 20 == 0:
                print(f"  Progress: {total}/{len(rows)}")
            break
        except Exception as e:
            if attempt < 2:
                time.sleep(2)
            else:
                print(f"  Error batch {i//batch_size+1}: {e}")
                errors += 1

print(f"\nDone: {total} inserted, {errors} batch errors")
