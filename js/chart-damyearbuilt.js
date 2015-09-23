$(function () {

  'use strict';

  // For now, trigger chart creation with a sql call here.
  // This should really be done by an event triggered by the map.
  var sql = new cartodb.SQL({ user: 'clientdemos' });
  sql.execute('SELECT * FROM usgs_drip_dams').done(function (data) {

    // Extract the year built values from each dam into an arrray.
    var yearBuiltArray = data.rows.reduce(function (result, dam) {
      var year = dam.damyearbuiltremovedstructure || dam.damyearbuiltoriginalstructure;
      if (year) {
        result.push(parseInt(year));
      }
      return result;
    }, []);

    // Create the chart with just the year built data.
    createChart(yearBuiltArray);

  });

  function createChart(yearBuiltArray) {
    var ctx = $('#chart-damyearbuilt').get(0).getContext('2d');
    var yearData = getYearData(yearBuiltArray);

    var chartData = {
      labels: yearData.labels,
      datasets: [
        {
          fillColor: '#43808A',
          strokeColor: '#43808A',
          data: yearData.data
        }
      ]
    };

    new Chart(ctx).Bar(chartData, {
      responsive: true,
      scaleFontSize: 11,
      tooltipFontSize: 12
    });

  }

  /**
   * Quantizes years into ranges, an returns labels and data for building a chart of year counts.
   * @param years {array[int]}
   * @returns {object} object with `labels` and `data` properties.
   *   labels: array of year range labels as strings.
   *   data: array of year counts for each year range.
   */
  function getYearData(years) {
    var sortedYears = years.sort(function (a, b) {
      return a > b ? 1 : a < b ? -1 : 0;
    });
    var min = sortedYears[0];
    var max = sortedYears[sortedYears.length - 1];
    var labels = [];
    var data = [];

    // Get min/max values based on factor-of-10 year intervals (e.g. 1971-1990).
    var rangeMin = endsIn1(min) ? min : floor10(min - 1) + 1;
    var rangeMax = ceil10(max);

    // Determine the year range size necessary to achieve 10 or fewer groupings.
    var rangeSize = ceil10((rangeMax - rangeMin) / 10);

    // Populate label array as strings.
    // Populate data array of year counts for each year range.
    for (var i = rangeMin, j = 0; i <= rangeMax; i = i + rangeSize) {
      var labelMin = i;
      var labelMax = i + rangeSize - 1;
      var label = labelMin + '-' + labelMax;
      labels[j] = label;
      data[j] = years.filter(inRange(labelMin, labelMax)).length;
      j++;
    }

    return {
      labels: labels,
      data: data
    };
  }

  function ceil10(num) {
    return num + (10 - (num % 10));
  }

  function floor10(num) {
    return num - (num % 10);
  }

  function endsIn1(num) {
    return ceil10(num) === (num - 1);
  }

  function inRange(min, max) {
    return function (num) {
      return num >= min && num <= max;
    };
  }

});
