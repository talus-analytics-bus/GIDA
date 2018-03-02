(() => {
	// inject "running x" into data
	const getRunningValues = (data, selected) => {
		data.map(d => {
			let runningValue = 0;
			d.children = d.children
				.sort((a, b) => a[selected] < b[selected])
				.map(c => {
					c.value0 = runningValue;
					runningValue += c[selected];
					c.value1 = runningValue;
					return c;
				});
			return d;
		})
		.sort((a, b) => a[selected] > b[selected]);
		return data;
	};

	App.buildCategoryChart = (selector, param = {}) => {
		const oppNoun = (param.moneyType === 'r') ? 'Funder' : 'Recipient';
		let colors = (param.moneyType === 'r') ? App.receiveColorPalette : App.fundColorPalette;
		// colors = colors.slice(0, 5);

		const selected = param.selected || 'total_spent';

		// start building the chart
		const margin = { top: 70, right: 80, bottom: 30, left: 200 };
		const width = 800;
		const height = 500;

		const chart = d3.select(selector).append('svg')
			.classed('category-chart', true)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
				.attr('transform', `translate(${margin.left}, ${margin.top})`);

		// const data = getRunningValues(rawData, selected);
		//
		// const maxValue = d3.max(data, d => d[selected]);
		const x = d3.scaleLinear()
			.range([1, width]);
		const y = d3.scaleBand()
			.padding(0.25)
			.range([0, height]);
		const colorScale = d3.scaleLinear()
			.domain([0, 1])
			.range([
				colors[2],
				colors[0],
			]);

		const xAxis = d3.axisTop()
			.ticks(5)
			.tickFormat(App.siFormat)
			.scale(x);
		const yAxis = d3.axisLeft()
			.scale(y)
			.tickSize(0)
			.tickSizeOuter(5)
			.tickPadding(7);

		const allBars = chart.append('g');

		const xAxisG = chart.append('g')
			.attr('class', 'x axis')
			.style('stroke-width', 1)
			.call(xAxis);

		const yAxisG = chart.append('g')
			.attr('class', 'y axis')
			.call(yAxis)
			.style('font-size', '0.4em')
			.style('font-weight', '600');

		const legendG = chart.append('g')
			.attr('transform', `translate(${width / 3}, ${height})`);
		const defs = chart.append('defs');

		const gradient = defs.append('linearGradient')
			.attr('id', 'legend-gradient')
			.attr('y1', '0%')
			.attr('y2', '0%')
			.attr('x1', '0%')
			.attr('x2', '100%');

		gradient.append('stop')
			.attr('class', 'gradient-start')
			.attr('offset', '0%')
			.attr('stop-color', colors[2])
			.attr('stop-opacity', 1);

		gradient.append('stop')
			.attr('class', 'gradient-stop')
			.attr('offset', '100%')
			.attr('stop-color', colors[0])
			.attr('stop-opacity', 1);

		legendG.append('rect')
			.attr('height', 20)
			.attr('width', 300)
			.style('fill', 'url(#legend-gradient');

		// add axes labels
		let xAxisLabel = 'Total Funds Disbursed by Core Capacity';
		if (param.moneyType === 'r') xAxisLabel = 'Total Funds Received by Core Capacity';
		chart.append('text')
			.attr('class', 'axis-label')
			.attr('x', width / 2)
			.attr('y', -50)
			.style('font-size', '1.25em')
			.text(xAxisLabel);

		chart.append('text')
			.attr('x', width / 2)
			.attr('y', -30)
			.style('font-weight', 600)
			.style('text-anchor', 'middle')
			.text('Funds');

		chart.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', -170)
			.attr('x', -height / 2)
			.style('font-weight', 600)
			.style('text-anchor', 'middle')
			.text('Core Capacity');

		chart.update = (rawData, newSelector = selected) => {
			const data = getRunningValues(rawData, newSelector)
				.sort((a, b) => {
					if (a[newSelector] < b[newSelector]) {
						return 1;
					} else {
						return -1;
					}
				});
			// set new axes and transition
			const maxVal = d3.max(data, d => d[newSelector]);
			const maxChild = d3.max(data, d => d3.max(d.children, c => c[newSelector]));
			x.domain([0, 1.1 * maxVal]);
			y.domain(data.map(d => d.name));
			colorScale.domain([0, maxChild]);
			const bandwidth = y.bandwidth();

			// legend labels
			legendG.selectAll('text').remove();
			legendG.append('text')
				.attr('x', 300)
				.attr('y', -10)
				.style('text-anchor', 'middle')
				.text(App.formatMoney(maxChild));
			legendG.append('text')
				.attr('y', -10)
				.style('text-anchor', 'middle')
				.text(App.formatMoney(0));
			legendG.append('text')
				.attr('x', 150)
				.attr('y', -10)
				.style('text-anchor', 'middle')
				.text('Funds');

			// remove first
			let barGroups = allBars.selectAll('.bar-group')
				.remove().exit().data(data);

			const newGroups = barGroups.enter()
				.append('g')
				.attr('class', 'bar-group')
				.attr('transform', d => `translate(0, ${y(d.name)})`);

			barGroups = newGroups.merge(barGroups);

			barGroups.selectAll('rect')
				.data(d => d.children.map(c => ({ cc: d.name, country: c })))
				.enter()
				.append('rect')
				.attr('height', bandwidth)
				.style('fill', d => colorScale(d.country[newSelector]))
				.transition()
				.duration(1000)
				.attr('x', d => x(d.country.value0))
				.attr('width', d => x(d.country.value1) - x(d.country.value0))
				.each(function addTooltip(d) {
					$(this).tooltipster({
						content: `<b>Core Capacity:</b> ${d.cc}` +
						`<br><b>${oppNoun}:</b> ${App.getCountryName(d.country.iso)}` +
						`<br><b>Total Committed Funds:</b> ${App.formatMoney(d.country.total_committed)}` +
						`<br><b>Total Disbursed Funds:</b> ${App.formatMoney(d.country.total_spent)}`,
					});
				});

			// set axes labels
			let xAxisLabel;
			if (param.moneyType === 'r') {
				if (newSelector === 'total_spent') {
					xAxisLabel = 'Funds Received by Core Capacity';
				} else {
					xAxisLabel = 'Funds Promised by Core Capacity';
				}
			} else {
				if (newSelector === 'total_spent') {
					xAxisLabel = 'Funds Disbursed by Core Capacity';
				} else {
					xAxisLabel = 'Funds Committed by Core Capacity';
				}
			}
			chart.select('.axis-label').text(xAxisLabel);

			xAxis.scale(x);
			xAxisG.transition()
				.duration(1000)
				.call(xAxis);

			yAxis.scale(y);
			yAxisG.transition()
				.duration(1000)
				.call(yAxis);

			yAxisG.selectAll('text').transition().duration(1000).text(function(d) {
				// const readableName = / - (.*)$/.exec(d)[1];
				const readableName = d;
				const shortName = getShortName(readableName);
				return shortName;
			});


			barGroups.append('text')
				.attr('class', 'bar-label')
				.attr('y', y.bandwidth() / 2)
				.attr('dy', '.35em')
				.text(d => {
					if (d[newSelector] !== 0) {
						return App.formatMoney(d[newSelector]);
					}
				})
				.transition()
				.duration(1000)
				.attr('x', d => x(d[newSelector]) + 5);

			// attach tooltips to y-axis labels
			chart.selectAll('.y.axis .tick text').each(function attachTooltip(d) {
					const capName = App.capacities.find(c => c.name === d).name;
					$(this).tooltipster({ content: `<b>${capName}</b>` });
				})
				.text(function(d) {
					// const readableName = / - (.*)$/.exec(d)[1];
					const readableName = d;
					const shortName = getShortName(readableName);
					return shortName;
				});

		};

		return chart;
	};

	function getShortName(s, maxLen=20) {
		if (s.length > maxLen) {
			if (/ /.test(s[maxLen - 1])) {
				return `${s.slice(0, maxLen - 2)}...`;
			} else {
				return `${s.slice(0, maxLen)}...`;
			}
		} else {
			return s;
		}
	}

})();
