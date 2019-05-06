 (() => {
    App.buildLineTimeChart = (selector, data, param = {},country) => {
        // remove existing
        d3.select(selector).html('');

        // start building the chart
        const margin = { top: 30, right: 20, bottom: 30, left: 75 };
        const width = 790;
        const height = 230;
        //const color = d3.color(param.color || 'steelblue');
        //const lightColor = param.lightColor || color.brighter(2);
        const color = param.color;
        const middleColor = param.middleColor;
        const lightColor = param.lightColor;

        const chart = d3.select(selector).append('svg')
        .classed('time-chart', true)
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

        const x = d3.scaleLinear()
        .domain([d3.min(data,d => d.year), d3.max(data, d => d.year )])
        .range([0, width]);

        const maxValue = d3.max(data, d => d3.max([d.total_spent, d.total_committed]));

        // define height of zero bar
        const y = d3.scaleLinear()
        .domain([0, 1.2 * maxValue])
        .range([height, 0])
        .nice();

        // fill under the curve
        const areaSpent = chart.selectAll('area-const-spent')
            .data([data])
            .enter().append('g');

        const area = d3.area()
            .x(d => x(d.year))
            .y0(height)
            .y1(d => y(d.total_spent));

        areaSpent.append('path')
            .attr('class', 'area')
            .attr('d', area)
            .style('fill', lightColor)
            .attr('opacity', 0.5);

        const xAxis = d3.axisBottom()
        //.attr('class', 'tickBottom')
        .ticks(5)
        .tickSize(4)
        .tickSizeOuter(4)
        .tickFormat(d => d.toString())
        .scale(x);

        const yAxis = d3.axisLeft()
        //.attr('class', 'tickLeft')
        .ticks(4)
        .tickSize(2)
        .tickSize(2)
        .tickSizeOuter(3)
        .tickPadding(10)
        .tickFormat(App.siFormat)
        .scale(y);

        //const bandwidth = x.bandwidth();

        chart.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis);

        chart.append('g')
        .attr('class', 'y axis')
        .call(yAxis);

        chart.selectAll('.domain')
        .style('stroke','#c0c0c0');

        chart.selectAll('g.tick line')
        .style('stroke','#c0c0c0');

        // ** lines **

        // committed line
        const lineConstComm = chart.selectAll('path-const-comm')
               .data([data])
               .enter().append('g');

        const lineCommitted = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.total_committed));

        lineConstComm.append('path')
            .attr('d', lineCommitted)
            .attr('fill', 'none')
            .attr('stroke', middleColor)
            .attr('stroke-width', 2)
            .style("stroke-dasharray", ("3, 3"));

        // spent line
        const lineConstSpent = chart.selectAll('path-const-spent')
            .data([data])
            .enter().append('g');

        const lineSpent = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.total_spent));

        lineConstSpent.append('path')
            .attr('d', lineSpent)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 3);

          /* const lineStyles = {
            All: {
                'stroke': 'red',
                'stroke-width':3,
            },
            'total_committed': {
                'stroke': '#9064a4',
				'stroke-width': 2,
            },
            'total_spent': {
				'stroke': '#57285a',
				'stroke-width': 4,
            },
        }; */


        const pointGroups = chart.selectAll('.point-group')
            .data(data)
            .enter().append('g');

        pointGroups.append('circle')
            .attr('class', (d,i)=> `point-circle-${i}`)
            .attr('transform',d => {
                return `translate (${x(d.year)},${y(d.total_spent)})`;
            })
            .attr('r',5)
            .style('fill','white')
            .attr('stroke-width',3)
            .attr('stroke','grey')

        /*const textGroups = chart.selectAll('.text-group')
            .data(data)
            .enter().append('g');

        textGroups.append('text')
            .attr('class', 'point-text')
            .attr('x', d => x(d.year))
            .attr('y',d => y(d.total_spent) - 20 )
            .attr('dy', '.35em')
            .text((d) => {
            return App.formatMoneyShort(d.total_spent)
        }); */

        // TOOLTIPS

        const tooltipGroupsSpent = chart.selectAll('.tooltip-group')
            .data(data)
            .enter().append('g');

        tooltipGroupsSpent.append('circle')
            .attr('transform',d => {
                return `translate (${x(d.year)},${y(d.total_spent)})`;
            })
            .attr('r',20)
            .style('fill','red')
            .attr('opacity',0)
            .on('mouseover', (d,i)=> {
                d3.selectAll(`point-circle-${i}`).style('fill','grey')
            })
            .on('mouseout', ()=> {
                d3.selectAll('.point-group circle').style('fill','white')
            })
            .each(function(d,i) {
                $(this).tooltipster({
                    content: `
                    <div class="tooltip-contents">
                        <div class="tooltip-header">
                            <div class="tooltip-primary-header">${country}</div> <div class="tooltip-sub-header">(${d.year})</div>
                        </div>

                        <div class="tooltip-row">
                            <div class="tooltip-row-title"> Committed </div>
                            <div class="tooltip-row-detail"> ${App.formatMoneyShort(d.total_committed)}&nbsp;USD </div>
                        </div>
                        <div class="tooltip-row">
                            <div class="tooltip-row-title"> Disbursed </div>
                            <div class="tooltip-row-detail"> ${App.formatMoneyShort(d.total_spent)}&nbsp;USD </div>
                        </div>
                    </div>
                    `,
                    trigger: 'hover',
                    side: 'top',
                    distance: 0,
                    theme: ['tooltipster-shadow', 'tooltipster-talus'],
                });
            });

        const tooltipGroupsComm = chart.selectAll('.tooltip-group')
            .data(data)
            .enter().append('g');

        tooltipGroupsComm.append('circle')
            .attr('transform',d => {
                return `translate (${x(d.year)},${y(d.total_committed)})`;
            })
            .attr('r',20)
            .style('fill','red')
            .attr('opacity',0)
            .each(function(d,i) {
                $(this).tooltipster({
                    content: `
                    <div class="tooltip-contents">
                        <div class="tooltip-header">
                            <div class="tooltip-primary-header">${country}</div> <div class="tooltip-sub-header">(${d.year})</div>
                        </div>

                        <div class= "tooltip-row">
                            <div class="tooltip-row-title"> Committed </div>
                            <div class="tooltip-row-detail"> ${App.formatMoneyShort(d.total_committed)}USD </div>
                        </div>
                        <div class="tooltip-row">
                            <div class="tooltip-row-title"> Disbursed </div>
                            <div class="tooltip-row-detail"> ${App.formatMoneyShort(d.total_spent)}USD </div>
                        </div>
                    </div>
                    `,
                    trigger: 'hover',
                    side: 'top',
                    distance: 0,
                    theme: ['tooltipster-shadow', 'tooltipster-talus'],
                });
            });

        /* // add bars
        const barGroups = chart.selectAll('.bar-group')
        .data(data)
        .enter().append('g')
        .attr('transform', d => `translate(${x(d.year)}, 0)`);

        // committed bar
        barGroups.append('rect')
        .attr('class', 'bar')
        .attr('y', d => y(d.total_committed))
        .attr('width', bandwidth / 2)
        .attr('height', d => height - y(d.total_committed))
        .style('fill', lightColor);
        barGroups.append('text')
        .attr('class', 'bar-text')
        .attr('x', bandwidth / 4)
        .attr('y', d => y(d.total_committed) - 8)
        .attr('dy', '.35em')
        .text((d) => {
            return App.formatMoneyShort(d.total_committed)
        });

        // disbursed bar
        barGroups.append('rect')
        .attr('class', 'bar')
        .attr('x', bandwidth / 2)
        .attr('y', d => y(d.total_spent))
        .attr('width', bandwidth / 2)
        .attr('height', d => height - y(d.total_spent))
        .style('fill', color);
        barGroups.append('text')
        .attr('class', 'bar-text')
        .attr('x', 3 * bandwidth / 4)
        .attr('y', d => y(d.total_spent) - 8)
        .attr('dy', '.35em')
        .text((d) => {
            return App.formatMoneyShort(d.total_spent);
        }); */

        //axis labels
        chart.append('text')
        .attr('class', 'chart-label')
        .attr('x', width/2)
        .attr('y', height + 30)
        .style('font-weight', '600')
        .text('Year');

        chart.append('text')
        .attr('class', 'chart-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', - 3* height/4)
        .attr('y', -55)
        .style('text-anchor', 'start')
        .style('font-weight', '600')
        .text('Amount (in USD)');

        // add legend
        const rectWidth = 50;
        // const legendShift =
        const legend = chart.append('g')
        .attr('transform', `translate(${(param.moneyType === 'r') ? width - 160 - 50 : width - 160}, -20)`);
        const legendGroups = legend.selectAll('g')
        .data([color, middleColor])
        .enter().append('g')
        .attr('transform', (d, i) => `translate(0, ${22 * i})`);

        legendGroups.append('line')
        .attr('x1', 1)
        .attr('x2', 42)
        .attr('y1', (d,i) => 25 - 45 * i)
        .attr('y2', (d,i) => 25 - 45 * i)
        .attr('stroke-width', (d,i) => 4 - i)
        //.attr('width', rectWidth)
        //.attr('height', 4)
        .style("stroke-dasharray", (d,i) => i * "6")
        .style('stroke', d => d);

        legendGroups.append('text')
        .attr('class', 'legend-label')
        .attr('x', rectWidth + 8)
        .attr('y', 6)
        .text((d, i) => (i === 0 ? 'Committed' : 'Disbursed'));

        legendGroups.append('text')
        .attr('class', 'legend-label')
        .attr('transform', (d, i) => `translate(${rectWidth + 8 + 68 - 6 * i}, 6)`)
        .text((d, i) => {
            if (param.moneyType === 'r') {
                return (i === 0) ? 'funds to receive' : 'funds received';
            }
            return 'funds';
        });

        return chart;
    };
})();
