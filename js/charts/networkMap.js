(() => {
	App.buildNetworkMap = (selector, initData, param = {}) => {
		console.log('initData');
		console.log(initData);
		// define colors
		const fundColor = App.networkFundColor;
		const receiveColor = App.networkReceiveColor;

		// define geo collection variables and maps
		let subregions = [];
		let countries = [];
		let funds = [];
		const countryMapByIso = d3.map();

		// establish chart constants
		const margin = { top: 60, right: 60, bottom: 120, left: 60 };
		const radius = param.radius || 300;
		const regionPadding = 0.02;
		const subregionPadding = regionPadding / 2;
		// const subregionPadding = 0.01;

		// start building the chart
		const chartContainer = d3.select(selector).append('svg')
			.classed('network-map-chart', true)
			.attr('width', 2 * radius + margin.left + margin.right)
			.attr('height', 2 * radius + margin.top + margin.bottom);
		const chart = chartContainer.append('g')
			.attr('transform', `translate(${radius + margin.left}, ${radius + margin.top})`);

		// add gradient definition
		const defs = chartContainer.append('defs');
		const gradient = defs.append('linearGradient')
			.attr('id', 'fund-gradient');
		gradient.append('stop')
			.attr('stop-color', fundColor)
			.attr('offset', '0%');
		gradient.append('stop')
			.attr('stop-color', receiveColor)
			.attr('offset', '100%');

		// add bounding box
		const clipPath = defs.append('clipPath').attr('id', 'circle-clip');
		clipPath.append('circle')
			.attr('r', radius);

		// add overlay
		chart.append('rect')
			.attr('class', 'overlay')
			.attr('transform', `translate(${-radius - margin.left}, ${-radius - margin.top})`)
			.attr('width', 2 * radius + margin.left + margin.right)
			.attr('height', 2 * radius + margin.top + margin.bottom);

		// add groups for chart
		const linkG = chart.append('g')
			.attr('class', 'link-g')
			.attr('clip-path', 'url(#circle-clip)');
		const arcG = chart.append('g');
		const countryArcG = arcG.append('g');
		const subregionArcG = arcG.append('g');
		const regionArcG = arcG.append('g');

		// define arc colors and arc paths
		const colorScale = d3.scaleLinear()
			.range([fundColor, receiveColor]);
		const regionArc = d3.arc()
			.innerRadius(radius + 28)
			.outerRadius(radius + 28 + 12)
			.startAngle(d => d.theta0)
			.endAngle(d => d.theta1);
		const subregionArc = d3.arc()
			.innerRadius(radius + 14)
			.outerRadius(radius + 14 + 12)
			.startAngle(d => d.theta0)
			.endAngle(d => d.theta1);
		const countryArc = d3.arc()
			.innerRadius(radius)
			.outerRadius(radius + 12)
			.startAngle(d => d.theta0)
			.endAngle(d => d.theta1);

		// define label arc
		const regionLabelArc = d3.arc()
			.innerRadius(radius + 28)
			.outerRadius(radius + 28 + 12)
			.startAngle(d => (d.theta1 - d.theta0 > 1 ? d.theta0 : d.theta0 - 1))
			.endAngle(d => (d.theta1 - d.theta0 > 1 ? d.theta1 : d.theta1 + 1));

		// define link path
		const ribbon = d3.ribbon()
			.source(d => d.source)
			.target(d => d.target)
			.radius(radius);


		// add legend
		const barWidth = 450;
		const barHeight = 14;
		const legend = chart.append('g')
			.attr('transform', `translate(${-barWidth / 2}, ${radius + 80})`);
		legend.append('rect')
			.attr('width', barWidth)
			.attr('height', barHeight)
			.style('fill', 'url(#fund-gradient)');
		legend.append('text')
			.attr('class', 'legend-label')
			.attr('y', barHeight + 12)
			.attr('dy', '.35em')
			.style('text-anchor', 'start')
			.text('Funds More');
		legend.append('text')
			.attr('class', 'legend-label')
			.attr('x', barWidth)
			.attr('y', barHeight + 12)
			.attr('dy', '.35em')
			.style('text-anchor', 'end')
			.text('Receives More');

		chart.update = (data, moneyType) => {
			addAnglesToData(data);
			drawArcs(data, moneyType);
			drawLinks(moneyType);
		};

		function drawArcs(data, moneyType) {
			// create region arcs
			const rArcs = regionArcG.selectAll('.arc')
				.data(data);
			rArcs.exit().remove();
			rArcs.enter().append('path')
				.attr('class', 'region-arc arc')
				.each(function addTooltip() {
					$(this).tooltipster({ plugins: ['follower'] });
				})
				.merge(rArcs)
					.each(function updateTooltip(d) {
						let contentStr = `<div class="nm-tooltip-title">${d.name}</div>`;
						if (d.totalFunded) {
							const fundTitle = getFundLabel('funded', moneyType);
							contentStr += `<div><b>${fundTitle}:</b> ` +
								`${App.formatMoney(d.totalFunded)}</div>`;
						}
						if (d.totalReceived) {
							const receiveTitle = getFundLabel('received', moneyType);
							contentStr += `<div><b>${receiveTitle}:</b> ` +
								`${App.formatMoney(d.totalReceived)}</div>`;
						}
						$(this).tooltipster('content', contentStr);
					})
					// .transition()
					.style('fill', getFundReceiveColor)
					.attr('d', regionArc);

			// create subregion arcs
			const sArcs = subregionArcG.selectAll('.arc')
				.data(subregions);
			sArcs.exit().remove();
			sArcs.enter().append('path')
				.attr('class', 'subregion-arc arc')
				.each(function addTooltip() {
					$(this).tooltipster({ plugins: ['follower'] });
				})
				.merge(sArcs)
					.each(function updateTooltip(d) {
						let contentStr = `<div class="nm-tooltip-title">${d.name}</div>`;
						if (d.totalFunded) {
							const fundTitle = getFundLabel('funded', moneyType);
							contentStr += `<div><b>${fundTitle}:</b> ` +
								`${App.formatMoney(d.totalFunded)}</div>`;
						}
						if (d.totalReceived) {
							const receiveTitle = getFundLabel('received', moneyType);
							contentStr += `<div><b>${receiveTitle}:</b> ` +
								`${App.formatMoney(d.totalReceived)}</div>`;
						}
						$(this).tooltipster('content', contentStr);
					})
					// .transition()
					.style('fill', getFundReceiveColor)
					.attr('d', subregionArc);

			// create country arcs
			let cArcs = countryArcG.selectAll('.arc')
				.data(countries);
			cArcs.exit().remove();
			cArcs = cArcs.enter().append('path')
				.attr('class', 'country-arc arc')
				.each(function addTooltip() {
					$(this).tooltipster({ plugins: ['follower'] });
				})
				.merge(cArcs);
			cArcs
				.on('mouseover', (d) => {
					d3.selectAll('.link')
						.filter(l => l.donor === d.name || l.recipient === d.name)
						.classed('country-hover', true);
				})
				.on('mouseout', () => {
					d3.selectAll('.link').classed('country-hover', false);
				})
				.each(function updateTooltip(d) {
					let contentStr = `<div class="nm-tooltip-title">${d.name}</div>`;
					if (d.totalFunded) {
						const fundTitle = getFundLabel('funded', moneyType);
						contentStr += `<div><b>${fundTitle}:</b> ${App.formatMoney(d.totalFunded)}</div>`;
					}
					if (d.totalReceived) {
						const receiveTitle = getFundLabel('received', moneyType);
						contentStr += `<div><b>${receiveTitle}:</b> ${App.formatMoney(d.totalReceived)}</div>`;
					}
					$(this).tooltipster('content', contentStr);
				})
				// .transition()
					.style('fill', getFundReceiveColor)
					.style('stroke', '#fff')
					.attr('d', countryArc);
			if (param.countryClickFn) {
				cArcs.on('click', d => param.countryClickFn(d.iso));
			}

			// create region arc labels
			const labelPaths = regionArcG.selectAll('.arc-label-path')
				.data(data);
			labelPaths.exit().remove();
			labelPaths.enter().append('path')
				.attr('class', 'arc-label-path')
				.merge(labelPaths)
					.attr('id', (d, i) => `arc-path-${i}`)
					.attr('d', regionLabelArc)
					.style('fill', 'none')
					.each(function positionLabel(d) {
						const firstArcSection = /(^.+?)L/;
						let newArc = firstArcSection.exec(d3.select(this).attr('d'))[1];
						newArc = newArc.replace(/,/g, ' ');

						// flip if bottom half of circle
						const avgTheta = (d.theta0 + d.theta1) / 2;
						if (avgTheta > Math.PI / 2 && avgTheta < 3 * Math.PI / 2) {
							const startLoc = /M(.*?)A/;
							const middleLoc = /A(.*?)0 0 1/;
							const endLoc = /0 0 1 (.*?)$/;
							const newStart = endLoc.exec(newArc)[1];
							const newEnd = startLoc.exec(newArc)[1];
							const middleSec = middleLoc.exec(newArc)[1];
							newArc = `M${newStart}A${middleSec}0 0 0 ${newEnd}`;
						}

						d3.select(this).attr('d', newArc);
					});
			let labels = regionArcG.selectAll('.arc-label')
				.data(data);
			labels.exit().remove();
			const newLabels = labels.enter().append('text')
				.attr('class', 'arc-label');
			newLabels.append('textPath')
				.attr('startOffset', '50%');
			labels = newLabels.merge(labels)
				.attr('dy', (d) => {
					const avgTheta = (d.theta0 + d.theta1) / 2;
					if (avgTheta > Math.PI / 2 && avgTheta < 3 * Math.PI / 2) return 18;
					return -6;
				});
			labels.select('textPath')
				.attr('xlink:href', (d, i) => `#arc-path-${i}`)
				.text(d => d.name);
		}

		function drawLinks(moneyType) {
			funds = funds.filter(d => countryMapByIso.get(d.recipient) !== undefined);

			// create links
			const links = linkG.selectAll('.link')
				.data(funds);
			links.exit().remove();
			links.enter().append('path')
				.attr('class', 'link')
				.each(function addTooltip() {
					$(this).tooltipster({ plugins: ['follower'] });
				})
				.merge(links)
					.attr('d', ribbon)
					.each(function updateTooltip(d) {
						const donorName = App.codeToNameMap.get(d.donor);
						const recName = App.codeToNameMap.get(d.recipient);
						const fundType = (moneyType === 'committed') ? 'Committed' : 'Disbursed';
						const contentStr = `<b>Funder:</b> ${donorName}` +
							`<br><b>Recipient:</b> ${recName}` +
							`<br><b>${fundType} Funds:</b> ${App.formatMoney(d.value)}`;
						$(this).tooltipster('content', contentStr);
					})
					.transition().style('fill', colorScale(0));
		}

		function addAnglesToData(data) {
			// empty collection variables and empty maps
			subregions = [];
			countries = [];
			funds = [];
			countryMapByIso.empty();

			// attach start and end angles to each of the countries/subregions/regions
			const totalFlow = d3.sum(data, d => d.totalFlow);
			let runningTheta = 0;
			data.forEach((region) => {
				const rTheta = (2 * Math.PI * region.totalFlow / totalFlow) - (2 * regionPadding);
				runningTheta += regionPadding;  // add beginning padding
				region.theta0 = runningTheta;
				const totalSPadding = (region.children.length - 1) * subregionPadding;

				region.children.forEach((subregion, i) => {
					subregions.push(subregion);

					const sTheta = (rTheta - totalSPadding) * (subregion.totalFlow / region.totalFlow);
					if (i > 0) runningTheta += subregionPadding;
					subregion.theta0 = runningTheta;
					subregion.children.forEach((country) => {
						// set map and add country to collection
						countryMapByIso.set(country.iso, country);
						countries.push(country);
						funds = funds.concat(country.funds);

						// set angles
						const cTheta = sTheta * (country.totalFlow / subregion.totalFlow);
						country.theta0 = runningTheta;
						runningTheta += cTheta;
						country.theta1 = runningTheta;
						country.runningTheta = country.theta0;  // used for assigning angles to funds
					});
					subregion.theta1 = runningTheta;
				});
				region.theta1 = runningTheta;
				runningTheta += regionPadding;  // add end padding
			});

			// attach start/end angles to each fund
			data.forEach((region) => {
				region.children.forEach((subregion) => {
					subregion.children.forEach((fc) => {
						fc.funds.forEach((f) => {
							let fundTheta = (fc.theta1 - fc.theta0) * (f.value / fc.totalFlow);
							if (fundTheta < 0) fundTheta = 0;  // TODO need to fix this!
							f.source = {
								startAngle: fc.runningTheta,
								endAngle: fc.runningTheta + fundTheta,
							};
							fc.runningTheta += fundTheta;

							const rc = countryMapByIso.get(f.recipient);
							if (rc === undefined) return;
							let recTheta = (rc.theta1 - rc.theta0) * (f.value / rc.totalFlow);
							if (recTheta < 0) recTheta = 0;  // TODO need to fix this!
							f.target = {
								startAngle: rc.runningTheta,
								endAngle: rc.runningTheta + recTheta,
							};
							rc.runningTheta += recTheta;
						});
					});
				});
			});
		}

		function getFundLabel(moneyFlow, moneyType) {
			if (moneyType === 'committed') {
				if (moneyFlow === 'funded') return 'Funds Committed to Disburse';
				return 'Committed funds to Receive';
			}
			if (moneyFlow === 'funded') return 'Disbursed funds';
			return 'Received Funds';
		}

		// function for getting fund/receive color
		function getFundReceiveColor(d) {
			const f = d.totalFunded;
			const r = d.totalReceived;
			return colorScale(r / (r + f));
		}

		chart.update(initData);
		return chart;
	};
})();
