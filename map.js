
var state_abbrvs = ["HI", "AK", "FL", "SC", "GA", "AL", "NC", "TN", "RI", "CT", "MA",
"ME", "NH", "VT", "NY", "NJ", "PA", "DE", "MD", "WV", "KY", "OH", 
"MI", "WY", "MT", "ID", "WA", "DC", "TX", "CA", "AZ", "NV", "UT", 
"CO", "NM", "OR", "ND", "SD", "NE", "IA", "MS", "IN", "IL", "MN", 
"WI", "MO", "AR", "OK", "KS", "LA", "VA"];


var state_electoral_votes = {"WA": 12, "DE": 3, "DC": 3, "WI": 10, "WV": 5, "HI": 4, "FL": 29, "WY": 3, "NH": 4, "NJ": 14, "NM": 5, "TX": 38, "LA": 8, "NC": 15, "ND": 3, "NE": 5, "TN": 11, "NY": 29, "PA": 20, "CA": 55, "NV": 6, "VA": 13, "CO": 9, "AK": 3, "AL": 9, "AR": 6, "VT": 3, "IL": 20, "GA": 16, "IN": 11, "IA": 6, "OK": 7, "AZ": 11, "ID": 4, "CT": 7, "ME": 4, "MD": 10, "MA": 11, "OH": 18, "UT": 6, "MO": 10, "MN": 10, "MI": 16, "RI": 4, "KS": 6, "MT": 3, "MS": 6, "SC": 9, "KY": 8, "OR": 7, "SD": 3};


var current_state = "USA";
var changing_state = true;
var bar_chart = null;

function format_pct(pct)
{
  // TODO: pretty sure the decimal thing is buggy but w/e
  var decimals = 1;
  var num  = Math.round(pct * Math.pow(10, decimals + 2)) / Math.pow(10, decimals);
  if (String(num).indexOf('.') == -1)
  {
    num += '.0';
  }

  return num;
}



var state_data;
d3.json("data/state_data.json", function(error, data) {
    if (error) throw error;
    state_data = data;
    visualize();
});

function visualize()
{
// demographic groups to split by
var groups = ['White', 'Black', 'Hispanic', 'Other']

function get_vote_pct(state_abbrv, year)
{
  // returns object with democratic and republican voting percentage
  
  // default year to 2016
  if (year === undefined)
  {
    year = 2016;
  }

  var dem_pct, total_voters;

  if (state_abbrv == 'USA')
  {
    var pcts = calculate_usa_total(year);
    dem_pct = pcts.dem_pct;
    total_voters = pcts.voting_pop;
  }
  else
  {
    var current_data = state_data[state_abbrv][year];
    var group_votes = {};
    var dem_voters = 0;
    total_voters = 0;
    groups.forEach(function(d){
      var vep = state_data[state_abbrv][2016]['VEP'][d];
      var group_voters = vep * current_data['turnout'][d];
      total_voters += group_voters;
      dem_voters += group_voters * current_data['dem_pct'][d];
    });

    dem_pct = dem_voters / total_voters;
  }
  
  return {
    'dem_pct': dem_pct,
    'rep_pct': 1 - dem_pct,
    'voting_pop': total_voters,
  }

}

function get_turnout_pct(state_abbrv, year)
{ 
  // default year to 2016
  if (year === undefined)
  {
    year = 2016;
  }

  var total_vep = 0;
  var total_voters = 0;

  if (state_abbrv == 'USA')
  {
    state_abbrvs.forEach(function(state){
      var current_data = state_data[state][year];
      groups.forEach(function(d){
        var vep = state_data[state_abbrv][2016]['VEP'][d];
        total_vep += vep;
        total_voters += vep * current_data['turnout'][d];
      });
    });

  }
  else
  {
    var current_data = state_data[state_abbrv][year];
    var total_voters = 0;
    var total_vep = 0;
    groups.forEach(function(d){
      var vep = state_data[state_abbrv][2016]['VEP'][d];
      total_vep += vep;
      total_voters += vep * current_data['turnout'][d];
    });
  }

  var turnout_pct = total_voters / total_vep;
  
  return turnout_pct;
}

function determine_color(classification)
{
  var winner = classification[0];
  var strength = classification[1];

  if (winner == 'dem' && strength == 'strong')
  {
    return '#40698b';
  }
  else if (winner == 'dem' && strength == 'weak')
  {
    return '#839db3';
  }
  else if (winner == 'rep' && strength == 'strong')
  {
    return '#af3a3a';
  }
  else if (winner == 'rep' && strength == 'weak')
  {
    return '#d79c9c';
  }
  else if (winner == 'neut' && strength == 'neut')
  {
    return '#c9b291';
  }
}

/* draw states on id #statesvg */ 
uStates.draw("#statesvg");

d3.selectAll('.state').on('click', function(d){
  changing_state = true;

  $('.name').html(d.n);
  current_state = d.id;

  // update sliders
  update_group_sliders(current_state);
  update_total_pct_slider(current_state);
  update_bar_chart();
  update_tables();

  changing_state = false; 
});

var table_color_scale = d3.scale.linear().domain([-.1,0,.1]).range(['#ef7f7f', '#ffffff', '#7fe086']);

function update_group_sliders(state)
{
  if (state != 'USA')
  {
    groups.forEach(function(group_name){
      var group = clean_group_name(group_name);
      var $vote_slider = $('#' + group + '-state-vote-slider').data('ionRangeSlider')
      var $turnout_slider = $('#' + group + '-state-turnout-slider').data('ionRangeSlider');

      var dem_pct = state_data[state][2016]['dem_pct'][group];
      var rep_pct = 1 - dem_pct;
      var turnout_pct = state_data[state][2016]['turnout'][group];

      $vote_slider.update({
        from: dem_pct,
      });

      $turnout_slider.update({
        from: turnout_pct,
      });

      var $slider_group = $('.' + group + '-state-vote-slider-container');
      $slider_group.find('.dem_pct_col span').html(format_pct(dem_pct));
      $slider_group.find('.rep_pct_col span').html(format_pct(rep_pct));
      $('.' + group + '-state-turnout-slider-container').find('.turnout_pct_col span').html(format_pct(turnout_pct));
    });

      $('.state-group-sliders .slider').each(function(i) {
        $(this).data('ionRangeSlider').update({ disable: false });
      });
  }
  else
  {
    groups.forEach(function(group_name){
      var group = clean_group_name(group_name);
      var $vote_slider = $('#' + group + '-state-vote-slider').data('ionRangeSlider')
      var $turnout_slider = $('#' + group + '-state-turnout-slider').data('ionRangeSlider');

      var group_dem_voters = 0;
      var group_voters = 0;
      var group_vep = 0;

      state_abbrvs.forEach(function(d){
        var dem_pct = state_data[d][2016]['dem_pct'][group];
        var turnout_pct = state_data[d][2016]['turnout'][group];
        var vep = state_data[d][2016]['VEP'][group];
        group_dem_voters += dem_pct * turnout_pct * vep;
        group_voters += turnout_pct * vep;
        group_vep += vep;
      });

      var dem_pct = group_dem_voters / group_voters;
      var rep_pct = 1 - dem_pct;
      var turnout_pct = group_voters / group_vep;

      $vote_slider.update({
        from: dem_pct,
      });

      $turnout_slider.update({
        from: turnout_pct,
      });

      var $slider_group = $('.' + group + '-state-vote-slider-container');
      $slider_group.find('.dem_pct_col span').html(format_pct(dem_pct));
      $slider_group.find('.rep_pct_col span').html(format_pct(rep_pct));
      $('.' + group + '-state-turnout-slider-container').find('.turnout_pct_col span').html(format_pct(turnout_pct));

      $('.state-group-sliders .slider').each(function(i) {
        $(this).data('ionRangeSlider').update({ disable: true });
      });
    });
  }
}


// update map colors, electoral votes bar, and sliders
function update_map(to_update_group_sliders)
{
  if (to_update_group_sliders === undefined)
  {
    to_update_group_sliders = true;
  }

  var dem_electoral_votes = 0;
  var rep_electoral_votes = 0;
  var neut_electoral_votes = 0;

  d3.selectAll('.state').style('fill', function(d){
    var vote_pct = get_vote_pct(d.id, 2016);
    var dem_pct = vote_pct['dem_pct'];
    var rep_pct = vote_pct['rep_pct'];

    var classification = classify_state(dem_pct);
    var winner = classification[0];

    if (winner == 'dem')
    {
      dem_electoral_votes += state_electoral_votes[d.id];
    }
    else if (winner == 'rep')
    {
      rep_electoral_votes += state_electoral_votes[d.id];
    }
    else if (winner == 'neut')
    {
      neut_electoral_votes += state_electoral_votes[d.id];
    }

    return determine_color(classification);
  });

  var $rep_bar = $('.rep_electoral_bar');
  var $dem_bar = $('.dem_electoral_bar');
  var $neut_bar = $('.neut_electoral_bar');

  var total_electoral_votes = dem_electoral_votes + rep_electoral_votes + neut_electoral_votes;
  $rep_bar.css('width', (rep_electoral_votes / total_electoral_votes) * 100 + '%');
  $dem_bar.css('width', (dem_electoral_votes / total_electoral_votes) * 100 + '%');
  $neut_bar.css('width', (neut_electoral_votes / total_electoral_votes) * 100 + '%');

  $rep_bar.html(rep_electoral_votes);
  $dem_bar.html(dem_electoral_votes);
  $neut_bar.html(neut_electoral_votes);

  if (to_update_group_sliders)
  {
    update_group_sliders(current_state);
  }

  update_total_pct_slider(current_state);
  update_bar_chart();
}

function clean_group_name(group_name)
{
  return group_name.replace(/ /g, '_').replace(/'/g, '').replace(/"/g, '');
}


function update_state_pct(state, group, attr, new_pct, year)
{
  // updates state data and refreshes the map

  // default year to 2016
  if (year === undefined)
  {
    year = 2016;
  }

  state_data[state][year][attr][group] = new_pct;
}

function update_total_pct_slider(state)
{
  // update total vote slider
  dem_pct = get_vote_pct(state, 2016).dem_pct;

  var $vote_slider = $('#state-total-vote-slider').data('ionRangeSlider')

  $vote_slider.update({
    from: dem_pct,
  });

  var $slider_group = $('.state-total-vote-slider-container');
  $slider_group.find('.dem_pct_col span').html(format_pct(dem_pct));
  $slider_group.find('.rep_pct_col span').html(format_pct(1 - dem_pct));


  // update total turnout slider
  turnout_pct = get_turnout_pct(state, 2016);

  var $turnout_slider = $('#state-total-turnout-slider').data('ionRangeSlider')

  $turnout_slider.update({
    from: turnout_pct,
  });

  var $slider_group = $('.state-total-turnout-slider-container');
  $slider_group.find('.grp_pct_col span').html(format_pct(turnout_pct));
}

function calculate_usa_total(year)
{
  // calculate USA dem pct
  var dem_votes = 0;
  var total_voters = 0;

  state_abbrvs.forEach(function(d){
    var voting_pcts = get_vote_pct(d, year);
    dem_votes += voting_pcts.dem_pct * voting_pcts.voting_pop;
    total_voters += voting_pcts.voting_pop;
  });

  var dem_pct = dem_votes / total_voters;

  return {
    'dem_pct': dem_pct,
    'voting_pop': total_voters,
  }
}

function classify_state(dem_pct)
{
  // change to .50 to .51 really light blue (no beige)
  var strong_cutoff = .55;
  var weak_cutoff = .51;

  if (dem_pct > strong_cutoff)
  {
    return ['dem', 'strong'];
  }
  else if (dem_pct > weak_cutoff)
  {
    return ['dem', 'weak'];
  }
  else if ((1 - dem_pct) > strong_cutoff)
  {
    return ['rep', 'strong'];
  }
  else if ((1 - dem_pct) > weak_cutoff)
  {
    return ['rep', 'weak'];
  }
  else
  {
    return ['neut', 'neut'];
  }
}

    // create state group sliders
    groups.forEach(function(group_name, i){
      var group = clean_group_name(group_name);

      var html = "<div class='col-lg-6'>";
      html += '<table style="width:100%;"><tr><td><h3>' + group + '</h3></td><td style="text-align:right;"><h3><a href="#" class="btn btn-primary-outline group-reset-btn" data-group="' + group + '"><i class="icon-undo"></i></a></h3></td></tr></table>';
      html += '\
                    <div class="slider-container ' + group + '-state-vote-slider-container"> \
                    <table class="slider_table"> \
                      <tr> \
                          <td valign="middle" class="dem_pct_col pct_col grp_pct_col"><span> 00%</span></td> \
                          <td class="slider_col"><input type="text" class="slider vote_slider" id="' + group + '-state-vote-slider" data-group="' + group + '" value="" name="range" /></td> \
                          <td class="rep_pct_col pct_col grp_pct_col"><span> 00%</span></td> \
                      </tr> \
                      <tr><td colspan="3" class="slider_title">Vote Share</td></tr> \
                    </table> \
                  </div>';

      html += '\
                    <div class="slider-container ' + group + '-state-turnout-slider-container neutral-slider"> \
                    <table class="slider_table"> \
                      <tr> \
                          <td valign="middle" class="turnout_pct_col pct_col grp_pct_col"><span> 00%</span></td> \
                          <td class="slider_col"><input type="text" class="slider turnout_slider" id="' + group + '-state-turnout-slider" data-group="' + group + '" value="" name="range" /></td> \
                          <td valign="middle" class="pct_col grp_pct_col"></td> \
                          <tr><td colspan="3" class="slider_title">Turnout</td></tr> \
                      </tr> \
                    </table> \
                    <table class="table historical-table ' + group + '-table"> \
                      <tr><th></th><th>2012</th><th>2016</th></tr> \
                      <tr class="dem_pct_row"><td>Dem %</td><td class="year_2012">51%</td><td class="year_2016">52%</td></tr> \
                      <tr class="turnout_pct_row"><td>Turnout</td><td class="year_2012">51%</td><td class="year_2016">52%</td></tr> \
                    </table> \
                  </div> \
                </div>';


      $state_group_sliders = $('.state-group-sliders');
      $state_group_sliders.append(html);
    });

  // initialize state group sliders
  $(".slider.vote_slider").ionRangeSlider({
      hide_min_max: true,
      keyboard: false,
      min: 0,
      max: 1,
      step: .001,
      hide_from_to: true,
      prettify_enabled: true,
      onChange: function(data) {
          // update left and right
          var dem_pct = data.from;
          var rep_pct = 1 - dem_pct;
          var group = data['input'].data('group')
          var $slider_group = $('.' + group + '-state-vote-slider-container');
          $slider_group.find('.dem_pct_col span').html(format_pct(dem_pct));
          $slider_group.find('.rep_pct_col span').html(format_pct(rep_pct));

          if (!changing_state)
          {
            update_state_pct(current_state, group, 'dem_pct', data.from);
          }
          update_map(false);
          update_tables();
      },
      prettify: function (num) {
          return format_pct(num);
      },
  });

  $(".slider.turnout_slider").ionRangeSlider({
      hide_min_max: true,
      keyboard: false,
      min: 0,
      max: 1,
      step: .001,
      hide_from_to: true,
      prettify_enabled: true,
      onChange: function(data) {
          // update left and right
          var turnout_pct = data.from;
          var group = data['input'].data('group')
          var $slider_group = $('.' + group + '-state-turnout-slider-container');
          $slider_group.find('.turnout_pct_col span').html(format_pct(turnout_pct));

          if (!changing_state)
          {
            update_state_pct(current_state, group, 'turnout', data.from);
          }

          update_map(false);
          update_tables();
      },
      prettify: function (num) {
          return format_pct(num);
      },
  });


  function update_usa_pct(group, attr, new_pct)
  {
    var old_pct = state_data['USA'][2016][attr][group];
    var change = 1 + ((new_pct - old_pct) / old_pct);
    state_abbrvs.forEach(function(state){
      state_data[state][2016][attr][group] *= change;
    });

    state_data['USA'][2016][attr][group] = new_pct;
    update_bar_chart();
  }

  function input_to_data(input_data)
  {
     var vep = []
     groups.forEach(function(group){
      vep.push(input_data[2016]['VEP'][group])
     });

     var total_vep = d3.sum(vep);
     vep = vep.map(function(d) { return d / total_vep });

     var voters = [];
     groups.forEach(function(group){
      voters.push(input_data[2016]['VEP'][group] * input_data[2016]['turnout'][group]);
     });

     var total_voters = d3.sum(voters);
     voters = voters.map(function(d) { return d / total_voters });

     var data = [groups, vep, voters];

     return data;
  }

  function create_bar_chart(state)
  {
    var data = input_to_data(state_data[current_state]);
    var chart = c3.generate({
      bindto: '#bar-chart',
      data: {
          rows: data,
          type: 'bar',
          order: null,
          groups: [
              groups
          ]
      },
      grid: {
          y: {
              lines: [{value:0}]
          }
      },
      axis: {
        x: {
            type: 'category',
            categories: ['2016 Expected VEP', '2016 Expected Voters'],
        },
        y: {
            tick: {
              format: d3.format('p'),
              values: [0, .25, .5, .75, 1.0],
            },
            min: 0,
            max: 1.0,
            padding: {
              top: 0,
              bottom: 0,
            }
        }
      },
      tooltip: {
        format: {
          value: format_pct,
        },
      },
      color: {
        pattern: ["#e59076", "#621e15", "#128dcd", "#083c52", "#64c5f2", "#61afaf", "#0f7369", "#9c9da1"]
      }
  });

    bar_chart = chart;
  }

  // initialize chart
  create_bar_chart(current_state);

  function update_bar_chart()
  {
    var data = input_to_data(state_data[current_state]);
    bar_chart.load({
      rows: data,
    });

  }

$(document).click(function(event) { 
    if(!$(event.target).closest('.state').length &&
       !$(event.target).is('.state') &&
       !$(event.target).closest('.no-usa-trigger').length &&
       !$(event.target).is('.no-usa-trigger')) {
        // clicked outside, so change to USA
        changing_state = true;

        $('.name').html('National');
        current_state = 'USA';

        // update sliders
        update_total_pct_slider(current_state);
        update_group_sliders(current_state);
        update_bar_chart();
        update_tables();

        changing_state = false;
      }
});

groups.forEach(function(d){
  $('.adjustment-btn-group-select').each(function(){
    $(this).append('<option>' + d + '</option>');
  });
});

$('.adjustment-btn').on('click', function(e){
  e.preventDefault();
  var attr = $(this).data('attr');
  var group = $('.' + attr + '-adjustment-btn-group-select').val();
  var adjustment = +$('.' + attr + '-adjustment-btn-amount').val();
  if (attr == 'vote')
  {
    attr = 'dem_pct';
  }
  if (isNaN(adjustment) || adjustment <= 0 || adjustment >= 1)
  {
    sweetAlert("Error", "Please enter an adjustment number between 0 and 1.", "error");
    return;
  }
  else
  {
      console.log(adjustment);
      make_adjustment('USA', group, attr, adjustment);
  }
});

$('.adjustment-btn-amount').on('change', function(){
  var value = $(this).val();
  var label = (value >= 0 ? "+" : "") + value * 100 + "%";
  var attr = $(this).data('attr');
  $('.' + attr + '-adjustment-btn-amount-label').html(label);
});

$('.adjustment-btn-group-select').on('change', function(){
  var group = $(this).val();
  var attr = $(this).data('attr');
  $('.' + attr + '-adjustment-btn-group-label').html(group);
});

function make_adjustment(state, group, attr, adjustment)
{
  if (state == 'USA')
  {
    state_abbrvs.forEach(function(state_abbrv){
      var old_pct = state_data[state_abbrv][2016][attr][group];
      var new_pct = Math.max(Math.min(old_pct + adjustment, 1.0), 0.0);
      update_state_pct(state_abbrv, group, attr, new_pct);
    });
    update_map(true);
    update_tables();
  }
  else
  {
    var old_pct = state_data[state_abbrv][2016][attr][group];
    var new_pct = Math.max(Math.min(old_pct + adjustment, 1.0), 0.0);
    update_state_pct(state, group, attr, new_pct);
    update_tables();
    update_map(true);
  }
}

function update_tables()
{
  // update total table
  var $table = $('.total-table');
  var dem_pct_2016 = get_vote_pct(current_state).dem_pct;
  var turnout_pct_2016 = get_turnout_pct(current_state);

  var dem_pct_2012 = get_vote_pct(current_state, 2012).dem_pct;
  var turnout_pct_2012 = get_turnout_pct(current_state, 2012);

  $table.find('.dem_pct_row .year_2012').html(format_pct(dem_pct_2012));
  $table.find('.turnout_pct_row .year_2012').html(format_pct(turnout_pct_2012));
  $table.find('.dem_pct_row .year_2016').html(format_pct(dem_pct_2016));
  $table.find('.turnout_pct_row .year_2016').html(format_pct(turnout_pct_2016));

  [2000, 2004, 2008].forEach(function(year){
    var turnout_pct = state_data[current_state][year]['turnout']['total'];
    var dem_pct = state_data[current_state][year]['dem_pct']['total'];
    $table.find('.dem_pct_row .year_' + year).html(format_pct(dem_pct));
    $table.find('.turnout_pct_row .year_' + year).html(format_pct(turnout_pct));
  });
  
  var dem_pct_bg = table_color_scale(dem_pct_2016 - dem_pct_2012);
  var turnout_pct_bg = table_color_scale(turnout_pct_2016 - turnout_pct_2012);
  var dem_pct_color = color_is_dark(dem_pct_bg) ? '#fff' : '#333';
  var turnout_pct_color = color_is_dark(turnout_pct_bg) ? '#fff' : '#333';
  
  $table.find('.dem_pct_row .year_2016').css('background', dem_pct_bg);
  $table.find('.turnout_pct_row .year_2016').css('background', turnout_pct_bg);
  $table.find('.dem_pct_row .year_2016').css('color', dem_pct_color);
  $table.find('.turnout_pct_row .year_2016').css('color', turnout_pct_color);

  groups.forEach(function(group){
    var $table = $('.' + group + '-table');
    var dem_pct_2016 = state_data[current_state][2016]['dem_pct'][group];
    var turnout_pct_2016 = state_data[current_state][2016]['turnout'][group];
    var dem_pct_2012 = state_data[current_state][2012]['dem_pct'][group];
    var turnout_pct_2012 = state_data[current_state][2012]['turnout'][group];

    if (current_state == 'USA')
    {
      var group_dem_voters = 0;
      var group_voters = 0;
      var group_vep = 0;

      state_abbrvs.forEach(function(d){
        var dem_pct = state_data[d][2016]['dem_pct'][group];
        var turnout_pct = state_data[d][2016]['turnout'][group];
        var vep = state_data[d][2016]['VEP'][group];
        group_dem_voters += dem_pct * turnout_pct * vep;
        group_voters += turnout_pct * vep;
        group_vep += vep;
      });

      dem_pct_2016 = group_dem_voters / group_voters;
      turnout_pct_2016 = group_voters / group_vep;
    }

    $table.find('.dem_pct_row .year_2012').html(format_pct(dem_pct_2012));
    $table.find('.turnout_pct_row .year_2012').html(format_pct(turnout_pct_2012));
    $table.find('.dem_pct_row .year_2016').html(format_pct(dem_pct_2016));
    $table.find('.turnout_pct_row .year_2016').html(format_pct(turnout_pct_2016));

    var dem_pct_bg = table_color_scale(dem_pct_2016 - dem_pct_2012);
    var turnout_pct_bg = table_color_scale(turnout_pct_2016 - turnout_pct_2012);
    var dem_pct_color = color_is_dark(dem_pct_bg) ? '#fff' : '#333';
    var turnout_pct_color = color_is_dark(turnout_pct_bg) ? '#fff' : '#333';
    
    $table.find('.dem_pct_row .year_2016').css('background', dem_pct_bg);
    $table.find('.turnout_pct_row .year_2016').css('background', turnout_pct_bg);
    $table.find('.dem_pct_row .year_2016').css('color', dem_pct_color);
    $table.find('.turnout_pct_row .year_2016').css('color', turnout_pct_color);

  });

}

function color_is_dark(c)
{
  // checks if a color is too dark
  // via http://stackoverflow.com/questions/12043187/how-to-check-if-hex-color-is-too-black
  var c = c.substring(1);      // strip #
  var rgb = parseInt(c, 16);   // convert rrggbb to decimal
  var r = (rgb >> 16) & 0xff;  // extract red
  var g = (rgb >>  8) & 0xff;  // extract green
  var b = (rgb >>  0) & 0xff;  // extract blue

  var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

  return (luma < 100)
}

function reset_group(group, state)
{
    var old_dem_pct = state_data[state][2012]['dem_pct'][group];
    var old_turnout = state_data[state][2012]['turnout'][group];

    // reset turnout
    var $slider_group = $('.' + group + '-state-turnout-slider-container');
    $slider_group.find('.turnout_pct_col span').html(format_pct(old_turnout));
    update_state_pct(state, group, 'turnout', old_turnout);

    // reset vote share
    var old_rep_pct = 1 - old_dem_pct;
    var $slider_group = $('.' + group + '-state-vote-slider-container');
    $slider_group.find('.dem_pct_col span').html(format_pct(old_dem_pct));
    $slider_group.find('.rep_pct_col span').html(format_pct(old_rep_pct));

    update_state_pct(state, group, 'dem_pct', old_dem_pct);
}

$('.group-reset-btn').on('click', function(e){
  e.preventDefault();
  $this = $(this);
  var group = $this.data('group');

  if (current_state != 'USA')
  {
    reset_group(group, current_state);
  }
  else
  {
    state_abbrvs.forEach(function(state){
      reset_group(group, state);
    });
  }

  update_map();
  update_tables();
});

$('.state-reset-btn').on('click', function(e){
  e.preventDefault();
  $this = $(this);

  if (current_state != 'USA')
  {
    groups.forEach(function(group){
      reset_group(group, current_state);
    });
  }
  else
  {
    state_abbrvs.forEach(function(state){
      groups.forEach(function(group){
        reset_group(group, state);
      });
    });
  }

  update_map();
  update_tables();
});

$(function(){
  update_map();
  update_total_pct_slider(current_state);
  update_group_sliders(current_state);
  update_bar_chart();
  update_tables();

  $('.disabled-slider').each(function(){ $(this).data('ionRangeSlider').update({ disable: true }); });
});

};