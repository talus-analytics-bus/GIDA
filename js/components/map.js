const Map = {};

(() => {
		/**
		 * Creates a D3.js world map in the container provided
		 * @param {String} selector A selector of the container element the map will be placed in
		 * @return {Object} An object containing the map and the layer containing drawn items
		 */
		class WorldMap extends Chart {

				constructor(selector, params = {}) {
						super(selector, params);

						this.mapSelector = selector;
						this.world = params.world;
						this.topoworld = topojson.feature(
								this.world,
								this.world.objects.countries,
						);

						this.transform = {
								k: 1,
								x: 0,
								y: 0,
						};
						this.zoomLevel = 1;

						this.countryData = this.topoworld.features
								.filter(d => d.properties.NAME !== 'Antarctica');

						this.data = undefined;

						this.svg.classed('map, true');

						// this.chart.on('click', this.stopped, true);

						this.margin.top = 30;

						this.init();

				}

				/**
				 * Add hatch definition to display for countries that have made/received
				 * contributions as a group only.
				 */
				addHatchDefs() {
					const html = `<pattern id="pattern-stripe" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
													<rect width="3.5" height="4" transform="translate(0,0)" fill="lightgray"></rect>
											</pattern>
											<mask id="mask-stripe">
													<rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-stripe)" />
											</mask>`;
					this.svg.append('defs').html(html);
				}

				// addShadowDefs() {
				// 	const html = `<defs>
				// 	<filter id="dropshadow" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
				// 	<feGaussianBlur in="StrokePaint" stdDeviation="2" result="strokeBlur"/>
				// 	<feOffset dx="0" dy="0" result="shadow"/>
				// 	<feComposite in="strokeBlur" in2="shadow" operator="over"/>
				// 	</filter>
				// 	</defs>`;
				// 	this.svg.append('defs').html(html);
				// }
				draw() {
						this.projection = d3.geoNaturalEarth2()
								.fitSize(
										[this.width, this.height + 60], // The + 60 is to make the main map bigger. Is there a better way?
										this.topoworld,
								)
								.precision(0.1);

						this.path = d3.geoPath()
								.projection(this.projection);

						// define zoom
						this.zoom = d3.zoom()
								.translateExtent([[0, 0], [this.containerwidth, this.height + 40]])
								.scaleExtent([1, 8])
								.on('zoom', () => this.zoomed());  // need to not overwrite `this`

						this.svg.call(this.zoom);

						this.addOverlay();
						this.addCountries();

						if (this.mapSelector != '.funding-recipient-map') {
								this.addButtons();
						}

				}

				addOverlay() {
						// add overlay: where zoom and pan events are
						this.newGroup('overlay')
								.append('rect')
								.attr('width', this.width)
								.attr('height', this.height)
								.on('click', () => this.reset());
				}

				addCountries() {
						const countryGroup = this.newGroup('countries')
								.selectAll('g')
								.data(this.countryData)
								.enter()
								.append('g');

						countryGroup.append('path')
								.attr('class', 'country')
								.attr('d', d => this.path(d));

						countryGroup.append('path')
								.datum(topojson.mesh(this.world, this.world.objects.countries, (a, b) => a !== b))
								.attr('class', 'boundary')
								.attr('d', d => this.path(d));
				}

				stopped() {
						if (d3.event.defaultPrevented) {
								d3.event.stopPropagation();
						}
				}

				// pan and zoom function
				zoomed() {
						this.zoomLevel = d3.event.transform.k;

						if (this.zoomLevel === 1) {
								d3.event.transform.x = 0;
								d3.event.transform.y = 0;
						}

						console.log(this.zoomLevel);

						this.countries.style('stroke-width', `${1.5 / d3.event.transform.k}px`);
						this.countries.attr('transform', d3.event.transform);

						this.toggleResetButton();
				}

				zoomIncrementally(value) {
						this.svg
								.transition()
								.duration(600)
								.call(this.zoom.scaleBy, value);
				}

				zoomTo(d) {
						// move country to top of layer
						// $(this.parentNode).append(this);

						// call zoom
						const bounds = this.path.bounds(d);
						const dx = bounds[1][0] - bounds[0][0];
						const dy = bounds[1][1] - bounds[0][1];
						const x = (bounds[0][0] + bounds[1][0]) / 2;
						const y = (bounds[0][1] + bounds[1][1]) / 2;
						const s = Math.max(1, Math.min(8, 0.7 / Math.max(dx / this.width, dy / this.height)));
						const t = [this.width / 2 - s * x, this.height / 2 - s * y - 90];
						return this.svg
								.transition()
								.duration(750)
								.call(this.zoom.transform, d3.zoomIdentity.translate(t[0], t[1]).scale(s));
				}

				reset() {
						this.svg
								.transition()
								.duration(750)
								.call(this.zoom.transform, d3.zoomIdentity);
				}

				update(data) {
						this.data = data;

				}

				addButtons() {
						this.newGroup('buttons');

						this.buttons
								.attr('transform', 'translate(0,30)')
								.style('font-family', 'Open Sans, sans-serif');

						this.addResetButton();
						this.addZoomButtons();
				}

				addResetButton() {
						this.newGroup('resetButton', this.buttons);

						const resetWidth = 50;
						const resetHeight = 25;

						this.buttons
								.resetButton
								.attr('transform', `translate(40, ${this.height - 61})`)
								.style('visibility', 'hidden');

						this.buttons
								.resetButton
								.append('rect')
								.attr('width', resetWidth)
								.attr('height', resetHeight)
								.attr('fill', '#ffffff')
								.attr('fill-opacity', 0.9)
								.attr('rx', 3)
								.attr('ry', 3)
								.style('stroke', 'black')
								.style('stroke-opacity', 0.6);

						this.buttons
								.resetButton
								.append('text')
								.attr('transform', `translate(6, ${resetHeight / 2 + 5})`)
								.text('Reset');

						this.buttons
								.resetButton
								.style('cursor', 'pointer')
								.on('click', () => {
										this.reset();
								});

				}

				toggleResetButton() {
						if (this.mapSelector == '.funding-recipient-map') { return; }

						if (this.zoomLevel > 1) {
								this.buttons
										.resetButton
										.style('visibility', 'visible');
						} else {
								this.buttons
										.resetButton
										.style('visibility', 'hidden');
						}
				}

				addZoomButtons() {
						this.newGroup('zoomButtons', this.buttons);

						const width = 25;
						const height = 50;

						this.buttons
								.zoomButtons
								.attr('transform', `translate(5, ${this.height - height - 36})`)
								.style('cursor', 'pointer');

						this.buttons
								.zoomButtons
								.append('rect')
								.attr('width', width)
								.attr('height', height)
								.attr('rx', 3)
								.attr('ry', 3)
								.attr('fill', 'white')
								.attr('fill-opacity', 0.9)
								.style('stroke', 'black')
								.style('stroke-opacity', 0.6);

						this.buttons
								.zoomButtons
								.append('rect')
								.attr('y', height / 2)
								.attr('width', width)
								.attr('height', 1)
								.attr('fill', 'black')
								.attr('fill-opacity', 0.6);

						this.newGroup('zoomIn', this.buttons.zoomButtons);
						const zoomIn = this.buttons.zoomButtons.zoomIn;

						this.newGroup('zoomOut', this.buttons.zoomButtons);
						const zoomOut = this.buttons.zoomButtons.zoomOut;

						// https://stackoverflow.com/questions/25969496/d3-js-append-a-span-with-glyphicon-class
						const zoomInButton = zoomIn.append('svg:foreignObject')
								.attr('width', width)
								.attr('height', width)
								.style('text-align', 'center')
								.append('xhtml:span')
								.style('vertical-align', 'middle')
								.attr('class', 'control glyphicon glyphicon-plus');

						zoomInButton.on('click', () => {
								this.zoomIncrementally(1.75);
						});

						const zoomOutButton = zoomOut.attr('transform', `translate(0, ${0.5 * height})`)
								.append('svg:foreignObject')
								.style('text-align', 'center')
								.attr('width', width)
								.attr('height', width)
								.append('xhtml:span')
								.style('vertical-align', 'middle')
								.attr('class', 'control glyphicon glyphicon-minus');

						zoomOutButton.on('click', () => {
								this.zoomIncrementally(.5);
						});
				}
		}


		Map.createWorldMap = (selector, world) => {
				const map = new WorldMap(selector, { world });
				map.addHatchDefs();
				// map.addShadowDefs();

				return map;

				// --- old ---
				// prepare map
				const width = 1200;
				const height = 640;
				// const scale = 170;
				const scale = 220;

				// define projection and path
				const projection = d3.geoNaturalEarth2()
						.translate([width / 2, height / 2])
						.scale(scale)
						.precision(0.1);
				const path = d3.geoPath().projection(projection);

				// define zoom
				const zoom = d3.zoom()
				// .translateExtent([0, 0], [20000, 20000])
						.scaleExtent([1, 8])
						.on('zoom', zoomed);

				// set map width and height
				const svg = d3.selectAll(selector).append('svg')
						.classed('map', true)
						.attr('preserveAspectRatio', 'xMinYMin meet')
						.attr('viewBox', `0 0 ${width} ${height}`)
						.append('g')
						.on('click', stopped, true);

				// add overlay: where zoom and pan events are
				svg.append('rect')
						.attr('class', 'overlay')
						.attr('width', width)
						.attr('height', height);

				// add mask
				// const mask = svg.append('mask')
				// 	.attr('id','viewport-cutout');
				//
				// mask.append('rect')
				// 	.attr('class','base-mask')
				// 	.attr('x', 0)
				// 	.attr('y', 0)
				// 	.attr('width', width)
				// 	.attr('height', height)
				// 	.attr('fill','white');
				//
				// const viewportWidth = width * 0.75;
				// const viewportHeight = height * 0.75;
				// const viewportX = (width - viewportWidth) / 2;
				// const viewportY = 50;
				//
				// mask.append('rect')
				// 	.attr('class','viewport-ellipse')
				// 	.attr('x', viewportX)
				// 	// .attr('x', 175)
				// 	.attr('y', viewportY)
				// 	// .attr('y', 50)
				// 	.attr('rx', 300)
				// 	.attr('ry', 300)
				// 	.attr('width', viewportWidth)
				// 	// .attr('width', width * .75)
				// 	.attr('height', viewportHeight)
				// 	// .attr('height', 20 + height * 0.703125)
				// 	.attr('fill','black');


				const g = svg.append('g');
				const nodeG = g.append('g')
						.attr('class', 'countries');
				g.append('g')
						.attr('class', 'links');

				// attach zoom
				svg.call(zoom);

				// add world data, and exclude Antarctica until we can get it to
				// display correctly on the map.
				const countries = topojson.feature(world, world.objects.countries).features
						.filter(d => d.properties.NAME !== 'Antarctica');
				nodeG.selectAll('.country')
						.data(countries)
						.enter().append('path')
						.attr('class', 'country')
						.attr('d', path);
				nodeG.append('path')
						.datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
						.attr('class', 'boundary')
						.attr('d', path);

				// add viewport cutout ellipse
				// svg.append('rect')
				// 	.attr('class', 'viewport-ellipse outer')
				// 	.attr('width', width)
				// 	.attr('height', height)
				// 	.attr('fill','#222222')
				// 	.style('pointer-events','none')
				// 	.attr('mask', 'url(#viewport-cutout)');

				// add viewport edge
				// svg.append('rect')
				// 	.attr('class', 'viewport-edge')
				// 	.attr('x', viewportX)
				// 	// .attr('x', 175)
				// 	.attr('y', viewportY)
				// 	.attr('rx', 300)
				// 	.attr('ry', 300)
				// 	.attr('width', width * .75)
				// 	.attr('height', height * 0.75);

				// pan and zoom function
				function zoomed() {
						g.style('stroke-width', `${1.5 / d3.event.transform.k}px`);
						g.attr('transform', d3.event.transform);
				}

				function zoomTo(d) {
						// move country to top of layer
						$(this.parentNode).append(this);

						// call zoom
						const bounds = path.bounds(d);
						const dx = bounds[1][0] - bounds[0][0];
						const dy = bounds[1][1] - bounds[0][1];
						const x = (bounds[0][0] + bounds[1][0]) / 2;
						const y = (bounds[0][1] + bounds[1][1]) / 2;
						const s = Math.max(1, Math.min(8, 0.7 / Math.max(dx / width, dy / height)));
						const t = [width / 2 - s * x, height / 2 - s * y - 90];
						return svg.transition()
								.duration(750)
								.call(zoom.transform, d3.zoomIdentity.translate(t[0], t[1]).scale(s));
				}

				function reset() {
						svg.transition()
								.duration(750)
								.call(zoom.transform, d3.zoomIdentity);
				}

				function stopped() {
						if (d3.event.defaultPrevented) d3.event.stopPropagation();
				}

				return { element: svg, projection, path, zoomTo, reset };
		};

})();
