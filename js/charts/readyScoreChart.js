(() => {
  App.buildReadyScoreChart = (selector, value, color, text) => {
    // remove existing
    d3.select(selector).html('');

    const height = 150;
    const width = 160;

    const chart = d3.select(selector).append('svg')
    .classed('scoreChartCirc',true)
    .attr('width',width)
    .attr('height',height)
    .append('g');

    // If no RS data available, show gray circle w/ text "data not available"
    // Otherwise show score
    const noData = value === '?';
    const circleTextStyle = (noData) ? {
      value: 'data not available',
      fontFamily: `'Open Sans', sans-serif`,
      fontSize: '1.25em',
      fontWeight: '400',
      fill: '#797979',
      y: 53,
    } : {
      value: value,
      fontFamily: `'Pathway Gothic One', sans-serif`,
      fontSize: '60px',
      fontWeight: '300',
      fill: 'white',
      y: 80,
    };

    // Draw circle
    const x = 80;
    const y = circleTextStyle.y;
    const circleY = 60;
    const scaleFactor = 0.8; // applied to circles and text in them
    chart.append('circle')
    .attr('transform', `translate(${x}, 60) scale(${scaleFactor})`)
    .attr('r',60)
    .style('fill',color);

    // Draw label inside circle
    const circleLabel = chart.append('text')
    .attr('class', 'chart-label3')
    .style('text-anchor', 'middle')
    .attr('x', x)
    .attr('y', y)
    .style('font-weight', circleTextStyle.fontWeight)
    .style('font-size', circleTextStyle.fontSize)
    .style('fill', circleTextStyle.fill)
    .style('font-family', circleTextStyle.fontFamily)
    .attr('transform', `scale(${scaleFactor})`)
    .text(circleTextStyle.value);

    // If no data, make no data message two lines inside circle
    if (noData) {
      circleLabel.text('');
      circleLabel.append('tspan')
        .attr('x', x)
        .attr('dy', 0)
        .text('data not')
      circleLabel.append('tspan')
        .attr('x', x)
        .attr('dy', '1em')
        .text('available')
    }

    // Draw label below circle
    chart.append('text')
    .attr('class', 'chart-label2')
    .style('text-anchor', 'middle')
    .attr('x', x)
    .attr('y', 135)
    .style('font-weight', '600')
    .style('font-size','15px')
    .style('fill', color)
    .text(text);

    return chart;
  };
})();
