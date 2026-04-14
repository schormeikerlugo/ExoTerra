import csv, sys

rows = []
with open(sys.argv[1], 'r') as f:
    for row in csv.DictReader(f):
        rows.append(row)

# Column mapping: csv_col -> db_col
col_map = {
    'pl_name': 'pl_name', 'hostname': 'hostname', 'sy_name': 'sys_name',
    'pl_bmasse': 'pl_masse', 'pl_rade': 'pl_rade', 'pl_dens': 'pl_dens',
    'pl_bmassj': 'pl_bmasse', 'pl_radj': 'pl_radj',
    'pl_orbper': 'pl_orbper', 'pl_orbsmax': 'pl_orbsmax',
    'pl_orbeccen': 'pl_orbeccen', 'pl_orbincl': 'pl_orbincl',
    'pl_eqt': 'pl_eqt', 'pl_insol': 'pl_insol',
    'discoverymethod': 'discoverymethod', 'disc_year': 'disc_year',
    'disc_facility': 'disc_facility', 'st_spectype': 'st_spectype',
    'st_teff': 'st_teff', 'st_rad': 'st_rad', 'st_mass': 'st_mass',
    'st_lum': 'st_lum', 'st_age': 'st_age', 'st_met': 'st_met',
    'ra': 'ra', 'dec': 'dec', 'sy_dist': 'sy_dist'
}

db_cols = list(col_map.values())
print(f"COPY exoplanets ({','.join(db_cols)}) FROM STDIN WITH (FORMAT csv, NULL '');")

for row in rows:
    vals = []
    for csv_col, db_col in col_map.items():
        v = row.get(csv_col, '').strip().strip('"')
        if not v:
            vals.append('')
        else:
            # Escape single quotes in text
            vals.append(v.replace('"', '""') if ',' in v or '"' in v else v)
    print(','.join(vals))

print("\\.")
