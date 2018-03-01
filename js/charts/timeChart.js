(() => {
	App.buildTimeChart = (selector, param = {}) => {
		// start building the chart
		const margin = { top: 30, right: 50, bottom: 35, left: 60 };
		const width = 600;
		const height = 100;
		const color = d3.color(param.color || 'steelblue');
		const lightColor = param.lightColor || color.brighter(2);

		const chart = d3.select(selector).append('svg')
			.classed('time-chart', true)
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
				.attr('transform', `translate(${margin.left}, ${margin.top})`);

		const x = d3.scalePoint()
			.padding(0.2)
			.range([0, width]);
		const y = d3.scaleLinear()
			.range([height, 0]);

		const xAxis = d3.axisBottom()
			.tickSize(0)
			.tickPadding(8)
			.scale(x);
		const yAxis = d3.axisLeft()
			.ticks(4)
			.tickSize(0)
			.tickFormat(App.siFormat)
			.scale(y);

		const xAxisG = chart.append('g')
			.attr('class', 'x axis')
			.attr('transform', `translate(0, ${height})`)
			.call(xAxis);
		const yAxisG = chart.append('g')
			.attr('class', 'y axis')
			.call(yAxis);

		const lineGroup = chart.append('g');
		const line = chart.append('path')
			.style('fill', 'none')
			.style('stroke-width', 1.5)
			.style('stroke', 'black');

		let init = false;
		chart.update = (newData, type) => {
			const maxVal = d3.max(newData, d => d[type]);
			x.domain(newData.map(d => d.year));
			y.domain([0, 1.2 * maxVal]);

			const lineFunc = d3.line()
				.x(d => x(d.year))
				.y(d => y(d[type]));

			line.transition()
				.duration(1000)
				.attr('d', lineFunc(newData));

			// Join to new Data
			let newGroup = lineGroup.selectAll('.node')
				.data(newData);

			// remove unneeded
			newGroup.exit().remove();

			// Create new groups
			const nodeGroup = newGroup.enter().append('g')
				.attr('class', 'node');

			// Add new objects
			nodeGroup.append('circle')
				.style('fill', 'none')
				.style('stroke', 'black')
				.attr('r', 5)
				.attr('cx', d => x(d.year))
				.attr('cy', d => y(d[type]));

			nodeGroup.append('text')
				.attr('dy', '-1em')
				.attr('dx', '1em')
				.style('text-anchor', 'middle')
				.attr('x', d => x(d.year))
				.attr('y', d => y(d[type]))
				.text(d => App.formatMoney(d[type]));

			// Update circles
			newGroup.selectAll('circle')
				.transition()
				.duration(1000)
				.attr('cx', d => x(d.year))
				.attr('cy', d => y(d[type]));

			newGroup.selectAll('text')
				.transition()
				.duration(1000)
				.attr('x', d => x(d.year))
				.attr('y', d => y(d[type]))
				.text(d => App.formatMoney(d[type]));

			xAxis.scale(x);
			xAxisG.transition().duration(1000).call(xAxis);

			yAxis.scale(y);
			yAxisG.transition().duration(1000).call(yAxis);

		};

		return chart;
	};
})();
