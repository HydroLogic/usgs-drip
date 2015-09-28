$(function () {

  'use strict';

  var chart;

  amplify.subscribe('map.damsChanged', onDamsChanged);

  function onDamsChanged(dams) {
    var yearBuiltArray = getYearBuiltArray(dams);
    var action = chart ? updateChart : createChart;

    action(yearBuiltArray);
  }

  /**
   * Extract the year built values from each dam into an arrray.
   * E.g. [1701, 1890, 1992, 1890, ...]
   */
  function getYearBuiltArray(dams) {
    var yearBuiltArray = dams.reduce(function (result, dam) {
      var year = dam.damyearbuiltremovedstructure || dam.damyearbuiltoriginalstructure;
      if (year) {
        result.push(parseInt(year));
      }
      return result;
    }, []);

    return yearBuiltArray;
  }

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

    chart = new Chart(ctx).Bar(chartData, {
      responsive: true,
      scaleFontSize: 11,
      tooltipFontSize: 12
    });
  }

  function updateChart(yearBuiltArray) {
    var dataset = chart.datasets[0];

    // Return min/max values for each of the existing year range labels.
    var bins = dataset.bars.map(function (bar) {
      var label = bar.label;
      var parts = label.split('-');
      return {
        min: parseInt(parts[0]),
        max: parseInt(parts[1])
      };
    });

    // Create a function which given an year, can return the appropriate bar.
    var getBar = function getBar(year) {
      for (var i = 0; i < bins.length; i++) {
        var bin = bins[i];
        if (year >= bin.min && year <= bin.max) {
          return dataset.bars[i];
        }
      }
    };

    // Reset chart values.
    dataset.bars.forEach(function (bar) {
      bar.value = 0;
    });

    // Iterate through input years, incrementing chart values.
    yearBuiltArray.forEach(function (year) {
      getBar(year).value++;
    });

    // TODO: Figure out how to fix the scale before updating the data.
    chart.update();
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
