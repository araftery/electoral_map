import csv
import json

import pandas as pd


# update VEP with new growth rates
with open('../data/state_data.json', 'r') as infile:
    state_data = json.load(infile)

with open('./growth_rates.csv', 'r') as infile:
    growth_rates = list(csv.reader(infile))

growth_rates = pd.DataFrame([{'race': i[0], 'growth_rate': i[1], 'state_code': i[2]} for i in growth_rates])

groups = ['Black', 'Other', 'Hispanic', 'White']

state_abbrvs = ["HI", "AK", "FL", "SC", "GA", "AL", "NC", "TN", "RI", "CT", "MA", \
"ME", "NH", "VT", "NY", "NJ", "PA", "DE", "MD", "WV", "KY", "OH", \
"MI", "WY", "MT", "ID", "WA", "DC", "TX", "CA", "AZ", "NV", "UT", \
"CO", "NM", "OR", "ND", "SD", "NE", "IA", "MS", "IN", "IL", "MN", \
"WI", "MO", "AR", "OK", "KS", "LA", "VA"]

for state_code in state_abbrvs:
    vep = state_data[state_code]['2016']['VEP']
    for group in groups:
        # reverse RCP estimate
        vep_2014 = vep[group] / 1.023
        growth_rate = float(growth_rates.loc[(growth_rates['state_code'] == state_code) & (growth_rates['race'] == group.lower())]['growth_rate'])
        vep_2016 = vep_2014 * (1 + growth_rate)
        state_data[state_code]['2016']['VEP'][group] = vep_2016

with open('state_data_with_new_vep.json', 'w+') as outfile:
    json.dump(state_data, outfile)


