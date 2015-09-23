$(function () {

  'use strict';

  var ctx = $('#chart-damyearbuilt').get(0).getContext('2d');

  var yearBuiltArray = [1750, 1789, 1830, 1835, 1837, 1841, 1848, 1850, 1850, 1851, 1852, 1855, 1855, 1856, 1857, 1860, 1860, 1865, 1872, 1874, 1889, 1895, 1898, 1900, 1900, 1900, 1901, 1901, 1902, 1902, 1902, 1903, 1905, 1907, 1907, 1908, 1908, 1909, 1910, 1912, 1912, 1912, 1913, 1913, 1913, 1914, 1915, 1919, 1921, 1921, 1922, 1923, 1924, 1925, 1925, 1927, 1927, 1928, 1928, 1928, 1929, 1929, 1930, 1931, 1932, 1935, 1936, 1937, 1939, 1939, 1940, 1945, 1950, 1955, 1955, 1955, 1955, 1956, 1958, 1960, 1965, 1968, 1969, 1975, 1975, 1989];
  var yearData = getYearData(yearBuiltArray);

  var chartData = {
    labels: yearData.labels,
    datasets: [
      {
        fillColor: 'rgba(151,187,205,0.2)',
        strokeColor: 'rgba(151,187,205,1)',
        pointColor: 'rgba(151,187,205,1)',
        pointStrokeColor: '#fff',
        pointHighlightFill: '#fff',
        pointHighlightStroke: 'rgba(151,187,205,1)',
        data: yearData.data
      }
    ]
  };

  new Chart(ctx).Line(chartData, { responsive: true });

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
