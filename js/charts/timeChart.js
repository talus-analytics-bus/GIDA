(() => {
	App.buildTimeChart = (selector, param = {}) => {
		// start building the chart
		const margin = { top: 70, right: 150, bottom: 50, left: 60 };
		const width = 400;
		const height = 300;
		const color = d3.color(param.color || 'steelblue');
		const lightColor = param.lightColor || color.brighter(2);
		const palette = (param.moneyType === 'd') ? App.fundColorPalette : App.receiveColorPalette;
		const ccs = ['P', 'D', 'R', 'Other'];
		const lineColors = d3.scaleOrdinal()
			.domain(['Total'].concat(ccs))
			.range(['black'].concat(palette));

		function getColor(d) {
			let color;
			if (d[0].cc === 'Total') {
				color = 'black';
			} else {
				const cc = d[0].cc.split('.')[0];
				if (['P', 'D', 'R'].includes(cc)) {
					color = lineColors(cc);
				} else {
					color = lineColors('Other');
				}
			}
			return color;
		}

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
			.tickSizeOuter(8)
			.scale(x);
		const yAxis = d3.axisLeft()
			.ticks(4)
			.tickSize(0)
			.tickSizeOuter(5)
			.tickPadding(8)
			.tickFormat(App.siFormat)
			.scale(y);

		const xAxisG = chart.append('g')
			.attr('class', 'x axis')
			.attr('transform', `translate(0, ${height})`)
			.style('stroke-width', 1)
			.call(xAxis);
		const yAxisG = chart.append('g')
			.attr('class', 'y axis')
			.call(yAxis);

		const labelGroup = chart.append('g');
		const lineGroup = chart.append('g');

		const labels = chart.append('g');

		const legendG = chart.append('g')
			.style('cursor', 'default')
			.attr('transform', `translate(${width - 20}, 20)`);

		const legend = legendG.selectAll('g')
			.data(['Total'].concat(ccs))
			.enter()
			.append('g');

		legend.append('text')
			.attr('x', 20)
			.attr('y', (d, i) => `${i}em`)
			.text(d => {
				return {
					Total: 'Total',
					P: 'Prevent',
					D: 'Detect',
					R: 'Respond',
					PoE: 'Point of Entry',
					CE: 'Chemical Events',
					RE: 'Radiation Emergencies',
					Other: 'Other',
				}[d];
			});

		legend.append('line')
			.attr('x1', 0)
			.attr('x2', 19)
			.attr('y1', (d, i) => i * 14 - 5)
			.attr('y2', (d, i) => i * 14 - 5)
			.style('stroke-width', 10)
			.style('stroke', d => lineColors(d));

		chart.update = (rawData, type) => {
			// need to first rotate timeseries data
			const lineData = convertData(rawData, type);

			// now update scales
			const maxVal = d3.max(rawData, d => d[type]);
			const yMax = 1.05 * maxVal;
			x.domain(rawData.map(d => d.year));
			y.domain([0, yMax]);

			const lineFunc = d3.line()
				.x(d => x(d.year))
				.y(d => y(d[type]));

			// Join to new Data
			let newGroup = lineGroup.selectAll('.line')
				.data(lineData);

			// remove unneeded
			newGroup.exit().remove();

			// Create new groups
			const lines = newGroup.enter().append('g')
				.attr('class', 'line');

			// Add new lines
			lines.append('path')
				.attr('class', d => d[0].cc.split('.')[0])
				.style('fill', 'none')
				.style('stroke-width', 2)
				.style('stroke', getColor)
				.attr('d', d => lineFunc(d));

			// update old lines
			newGroup.selectAll('path')
				.transition()
				.duration(1000)
				.attr('d', d => lineFunc(d));

			d3.selectAll('.line')
				.on('mouseout', function() {
					d3.selectAll('.line')
						.style('stroke-opacity', 1);
				})
				.on('mouseover', function() {
					d3.selectAll('.line')
						.style('stroke-opacity', 0);
					d3.select(this)
						.style('stroke-opacity', 1);
				})
				.each(function(d) {
					if ($(this).hasClass('tooltipstered')) {
						$(this).tooltipster('destroy');
					}
					let name;
					if (d[0].cc !== 'Total') {
						name = App.capacities.filter(c => c.id === d[0].cc)[0].name;
					} else {
						name = 'Total';
					}
					const content = name;
					// var content = `<b>${name}</b><br>`;
					// if (type === 'total_spent') {
					// 	content += 'Disbursed Funds<br>';
					// } else {
					// 	content += 'Committed Funds<br>';
					// }
					// content += d.map(x => `${x.year} - ${App.formatMoney(x[type])}`).join('<br>');
					$(this).tooltipster({
						content: content,
						side: 'top',
					});
				});

			legend.on('mouseover', function(d) {
					const arcOpacity = a => {
						if (d === 'Total') {
							return 1;
						} else if (d[0] === a.data.cc) {
							return 1;
						}
					};
					d3.selectAll('.arc')
						.selectAll('path')
						.style('stroke-opacity', arcOpacity)
						.style('fill-opacity', arcOpacity);

					d3.selectAll('.arc')
						.selectAll('text')
						.style('stroke-opacity', arcOpacity);

					d3.selectAll('.line')
						.style('stroke-opacity', l => {
							const lineCC = l[0].cc.split('.')[0];
							if (lineCC === 'Total') {
								return 1;
							} else if (lineCC === d) {
								return 1;
							} else if ((d === 'Other') && (!['P', 'D', 'R'].includes(lineCC))) {
								return 1;
							} else {
								return 0;
							}
						});
				})
				.on('mouseout', function(d) {
					d3.selectAll('.line')
						.style('stroke-opacity', l => {
							return 1;
						});
				});

			xAxis.scale(x);
			xAxisG.transition().duration(1000).call(xAxis);

			yAxis.scale(y);
			yAxisG.transition()
				.duration(1000)
				.call(yAxis.tickValues(getTickValues(yMax, 4)));

			// labels
			labels.selectAll('text').remove();
			labels.append('text')
				.attr('x', width / 2)
				.attr('y', -40)
				.style('font-size', '1.25em')
				.style('font-weight', 600)
				.style('text-anchor', 'middle')
				.text(() => {
					const dollar = App.formatMoney(0).split(' ')[1];
					if (type === 'total_spent') {
						return `Disbursed Funds (${dollar}) by Year`;
					} else {
						return `Committed Funds (${dollar}) by Year`;
					}
				});
			labels.append('text')
				.attr('x', width / 2)
				.attr('y', height + 40)
				.style('font-weight', 600)
				.style('text-anchor', 'middle')
				.text('Year');
			labels.append('text')
				.attr('transform', 'rotate(-90)')
				.attr('y', -50)
				.attr('x', -height / 2)
				.style('font-weight', 600)
				.style('text-anchor', 'middle')
				.text(() => {
					const dollar = App.formatMoney(0).split(' ')[1];
					return `Funds (${dollar})`;
				});

		};

		return chart;
	};

	function getTickValues(maxVal, numTicks) {
		const magnitude = Math.floor(Math.log10(maxVal)) - 1;
		var vals = [0];
		for (var i = 1; i <= numTicks; i++) {
			if (i === numTicks) {
				vals.push(maxVal);
			} else {
				vals.push(precisionRound((i / numTicks) * maxVal, -magnitude));
			}
		}
		return vals;
	}

	function precisionRound(number, precision) {
		const factor = Math.pow(10, precision);
		return Math.round(number * factor) / factor;
	}

	function convertData(data, type) {
		const lines = [];
		lines.push(data.map(y => {
			return {
				year: y.year,
				cc: 'Total',
				total_committed: y.total_committed,
				total_spent: y.total_spent,
			};
		}));
		console.log(data);
		App.capacities.forEach(c => {
			lines.push(data.map(d => {
				if (d.ccs[c.id] !== undefined) {
					return {
						year: d.year,
						cc: c.id,
						total_committed: d.ccs[c.id].total_committed,
						total_spent: d.ccs[c.id].total_spent,
					};
				} else {
					return {
						year: d.year,
						cc: c.id,
						total_committed: 0,
						total_spent: 0,
					};
				}
			}));
		});
		console.log(lines);
		return lines.filter(l => {
			return l.reduce((acc, cval) => {
				return acc || ((cval.total_committed !== 0) || (cval.total_spent !== 0));
			}, false);
		});
	}

})();
