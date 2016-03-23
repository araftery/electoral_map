import json

with open('inputs_EC_2.json', 'r') as infile:
    inputs_ec = json.load(infile)

state_abbrvs = ["HI", "AK", "FL", "SC", "GA", "AL", "NC", "TN", "RI", "CT", "MA", \
"ME", "NH", "VT", "NY", "NJ", "PA", "DE", "MD", "WV", "KY", "OH", \
"MI", "WY", "MT", "ID", "WA", "DC", "TX", "CA", "AZ", "NV", "UT", \
"CO", "NM", "OR", "ND", "SD", "NE", "IA", "MS", "IN", "IL", "MN", \
"WI", "MO", "AR", "OK", "KS", "LA", "VA", "USA"]

groups = {
    'af_am': 'Black',
    'az_plus_other': 'Other',
    'hisp': 'Hispanic',
    'white': 'White'
 }
state_data = {}

for state in inputs_ec:
    state_code = state['state_short']
    vep, dem_share, turnout = {}, {}, {}
    for group in groups:
        vep[groups[group]] = float(state['{}_vep_total_2016'.format(group)])
        dem_share[groups[group]] = 1 - float(state['{}_r_share'.format(group)])
        turnout[groups[group]] = float(state['{}_turnout_2012'.format(group)])

    turnout_2012 = {}
    for group in groups:
        turnout_2012[groups[group]] = float(state['{}_turnout_2012'.format(group)])

    state_data[state_code] = {
        '2012': {
            'turnout': turnout_2012,
            'dem_pct': dem_share,
        },
        '2016': {
            'VEP': vep,
            'dem_pct': dem_share,
            'turnout': turnout
        }
    }

usa_data = {}

vep = {}
dem_pct = {}
turnout = {}

for group in groups.values():
    group_total_vep = 0
    group_total_turnout = 0
    group_total_dem_votes = 0

    for state in state_data.values():
        group_total_vep += state['2016']['VEP'][group]
        group_total_turnout += state['2016']['VEP'][group] * state['2016']['turnout'][group]
        group_total_dem_votes += state['2016']['VEP'][group] * state['2016']['turnout'][group] * state['2016']['dem_pct'][group]

    vep[group] = group_total_vep
    turnout[group] = float(group_total_turnout) / group_total_vep
    dem_pct[group] = float(group_total_dem_votes) / group_total_turnout

state_data['USA'] = {
    '2000': {
        'turnout': {},
    },
    '2004': {
        'turnout': {},
    },
    '2008': {
        'turnout': {},
    },
    '2012': {
        'turnout': turnout,
        'dem_pct': dem_pct,
    },
    '2016': {
        'VEP': vep,
        'dem_pct': dem_pct,
        'turnout': turnout,
    }
}


# add extra nation-wide data
# turnout data from http://www.electproject.org/home/voter-turnout/voter-turnout-data
# voting data from http://ropercenter.cornell.edu/polls/us-elections/how-groups-voted/how-groups-voted-2012/ and https://drive.google.com/folderview?id=0Bz_uFI8VY7xLekx0cWdVcGhJblk&usp=sharing

state_data['USA']['2008']['dem_pct'] = {
    'total': .541,
    'White': .439,
    'Black': .96,
    'Hispanic': .684,
    'Other': .664,
}

state_data['USA']['2004']['dem_pct'] = {
    'total': .485,
    'White': .414,
    'Black': .889,
    'Hispanic': .546,
    'Other': .57,
}

state_data['USA']['2000']['dem_pct'] = {
    'total': .5,
    'White': .433,
    'Black': .909,
    'Hispanic': .639,
    'Other': .573,
}


abbrv_to_state = pd.read_csv('state_to_abbrv.csv').set_index('Abbrv')
historical_turnout = {i: pd.read_csv('historical_turnout/{}.csv'.format(i)) for i in (2000, 2004, 2008)}

for abbrv in state_abbrvs:
    state_name = abbrv_to_state.ix[abbrv]['State']
    for year in (2000, 2004, 2008):
        hist_data = historical_turnout[year]
        turnout = float(hist_data.loc[hist_data['State'] == state_name,'VEP Highest Office'])
        if not state_data[abbrv].get(unicode(year)):
            state_data[abbrv][unicode(year)] = {}

        if not state_data[abbrv][unicode(year)].get('turnout'):
            state_data[abbrv][unicode(year)]['turnout'] = {}

        state_data[abbrv][unicode(year)]['turnout']['total'] = turnout


historical_voting = pd.read_csv('historical_voting.csv').set_index('State')
for year in (2000, 2004, 2008):
    for abbrv in state_abbrvs:
        if not abbrv == 'USA':
            state_name = abbrv_to_state.ix[abbrv]['State']
            dem_pct = float(historical_voting.ix[state_name]['Dem {}'.format(year)])
            state_data[abbrv][unicode(year)]['dem_pct'] = {
                'total': dem_pct,
            }


with open('state_data.json', 'w+') as outfile:
    json.dump(state_data, outfile)
