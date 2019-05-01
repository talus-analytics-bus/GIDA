"use strict";
(() => {
		// colors
		const colorIndex = 3;
		// const purples = [
		// 		// "#e0ecf4",
		// 		'#bfd3e6',
		// 		'#9ebcda',
		// 		'#8c96c6',
		// 		'#8c6bb1',
		// 		'#88419d',
		// 		'#810f7c',
		// 		'#4d004b',
		// 		// "#4d004b",
		// ];
		const purples = [
				// "#e0ecf4",
				'#bfd3e6',
				'#88aac3',
				'#757fb6',
				'#75559d',
				'#713286',
				'#6a1266',
				'#3c003a',
				// "#4d004b",
		];

		// Countries are this color if they've funded/received money
		// but only as part of a group and we don't know how much they gave/got
		// because of that.
		const unspecifiedGray = 'rgb(204, 204, 204)';
		// const unspecifiedGray = '#515151';

		// source: http://colorbrewer2.org/#type=sequential&scheme=Greens&n=8
		// const greens = [
		// 		// "#f7fcf5",
		// 		// "#e5f5e0",
		// 		'#c7e9c0',
		// 		'#a1d99b',
		// 		'#74c476',
		// 		'#41ab5d',
		// 		'#238b45',
		// 		'#005a32',
		// ];
		const greens = [
				// "#f7fcf5",
				// "#e5f5e0",
				'#eaeff1',
				'#99c2ae',
				'#569778',
				'#3d8662',
				'#217249',
				'#045f32',
		];

		// const purplesOrig = [
		//   "#e0ecf4",
		//   "#bfd3e6",
		//   "#9ebcda",
		//   "#8c96c6",
		//   "#8c6bb1",
		//   "#88419d",
		//   "#810f7c",
		//   "#4d004b"
		// ];

		const orangesReverse = [
				'#fee391',
				'#fec44f',
				'#fe9929',
				'#ec7014',
				'#cc4c02',
				'#993404',
				'#662506',
		].reverse();

		const jeeColors = App.jeeColors;

		let map,
				indType,
				moneyFlow,
				moneyType,
				orgMoneyType,
				scoreType,
				activeCountry,
				currentNodeDataMap,
				startYear,
				endYear,
				orgStartYear,
				orgEndYear,
				supportType,
				showTooltips = true,
				page;

		const fundingColor = '#597251';
		const recipientColor = '#623B63';

		const setConstants = (params) => {
				// state variables for current map indicator
				indType = 'money';  // either 'money' or 'score'
				// let moneyFlow = 'funded';  // either 'funded' or 'received'
				moneyFlow = 'funded';  // either 'funded' or 'received'
				// let moneyType = 'disbursed';  // either 'committed' or 'disbursed'
				moneyType = 'committed';  // either 'committed' or 'disbursed'
				orgMoneyType = 'org-committed';  // either 'org-committed' or 'org-inkind'
				scoreType = 'score';  // either 'score' or 'combined'

				if (page === 'home') {
						showTooltips = false;
				}
				else {
						showTooltips = true;
				}

				// variables used throughout home page
				activeCountry = d3.select(null);  // the active country
				currentNodeDataMap = d3.map();  // maps country iso to the value on map
				startYear = App.dataStartYear;  // the start year of the time range shown
				endYear = App.dataEndYear + 1;  // the end year of the time range shown
				orgStartYear = App.dataStartYear;
				orgEndYear = App.dataEndYear + 1;
				params.ghsaOnly = true;

				if (App.mapSet !== undefined) {
						moneyFlow = App.mapSet;
						$(`input[name="rec-or-fund"][ind="${moneyFlow}"]`).prop('checked', true);
						App.mapSet = undefined;
				}

				if (App.mapType !== undefined) {
						indType = App.mapType === 'inkind' ? 'inkind' : 'money';
						$(`input[name="ind"][ind="${indType}"]`).prop('checked', true);
						App.mapType = undefined;
				}

				supportType = 'financial'; // 'financial' or 'inkind'

		};

		/**
		 * Returns formatting function for values in tooltips.
		 * @param  {[type]} indType [description]
		 * @return {[type]}         [description]
		 */
		const getValueFormat = (indType, params = {}) => {

			// For big table tooltips, return the simple version.
			if (params.bigTooltip === true) {
				return (indType === 'inkind' || indType === 'org-inkind') ? (val) => {
					return Util.comma(val) + ` project${val !== 1 ? 's' : ''}`;
				} : App.formatMoney;
			} else {
				return (indType === 'inkind') ? (val) => {
					return Util.comma(val) + ` <br><span class="inkind-value">in-kind support project${val !== 1 ? 's' : ''}</span>`;
				} : App.formatMoney;
			}
		};


		App.initHome = (params = {}) => {
				page = 'home';

				setConstants(params);

				moneyFlow = 'received';

				map = buildMap('.funding-recipient-map');
				d3.selectAll('.viewport-ellipse,.viewport-edge').remove();

				App.loadFundingData({ showGhsaOnly: App.showGhsaOnly });

				// get filter values
				 const ccs = _.clone(App.capacities).map(a => a.id);

				// clear out current data
				currentNodeDataMap.clear();

				// build data map; filter and only use data with valid country values
				App.countries.forEach((c) => {
						const filterCountOnce = (allProjects) => {
								const groupedById = _.groupBy(allProjects, 'project_id');
								return _.values(groupedById).map(d => d[0]);
						};

						const paymentsFunded = (App.fundingLookup[c.ISO2] === undefined) ? undefined : App.getMappableProjects(App.fundingLookup[c.ISO2], 'd', c.ISO2);
						const paymentsReceived = (App.recipientLookup[c.ISO2] === undefined) ? undefined : App.getMappableProjects(App.recipientLookup[c.ISO2], 'r', c.ISO2);

						const scoreObj = App.scoresByCountry[c.ISO2];

						// only include country in data map if it has a score or rec/don funds
						let fundedCommitted = 0;
						let fundedSpent = 0;
						// let providedInkind = 0;
						let receivedCommitted = 0;
						let receivedSpent = 0;
						// let receivedInkind = 0;
						let receivedInkindProvided = 0;
						let receivedInkindCommitted = 0;
						let providedInkindProvided = 0;
						let providedInkindCommitted = 0;
						let score = null;
						let combo = null;
						let receivedUnspecAmount = 0;
						let fundedUnspecAmount = 0;

						// Tabulate projects with DFS that had unspecified amount because
						// they were funded or received by a "region" (e.g., EU or Southeast Asia)
						// Get full list of projects for this funder/recipient
						// const allProjects = [].concat(paymentsFunded).concat(paymentsReceived).filter(d => d);
						const unspecAmounts = getUnspecAmountCounts(c.ISO2);

						if (paymentsFunded) {
								({
										totalCommitted: fundedCommitted,
										totalSpent: fundedSpent,
										totalInkindCommitted: providedInkindCommitted,
										totalInkindProvided: providedInkindProvided,
								} =
										getPaymentSum(paymentsFunded, ccs));
						}
						if (paymentsReceived) {
								({
										totalCommitted: receivedCommitted,
										totalSpent: receivedSpent,
										totalInkindCommitted: receivedInkindCommitted,
										totalInkindProvided: receivedInkindProvided,
								} =
										getPaymentSum(paymentsReceived, ccs));
						}

						if (scoreObj) {
								const capScores = scoreObj.avgCapScores;
								score = d3.mean(capScores, d => d.score);
								const numerator = 10 + Math.log10(1 + receivedSpent);
								const denominator = 5.01 - score;
								combo = numerator / denominator;
						}

						// set in node map
						currentNodeDataMap.set(c.ISO2, {
								fundedCommitted,
								fundedSpent,
								providedInkindCommitted,
								providedInkindProvided,
								receivedCommitted,
								receivedSpent,
								receivedInkindCommitted,
								receivedInkindProvided,
								score,
								combo,
						});
				});

				updateMap(false);

				const updatedFlags = () => {
						map.reset();
						updateMap(false);
				};

				// indType = 'money';  // either 'money' or 'score'
				// moneyFlow = 'funded';  // either 'funded' or 'received'
				// moneyType = 'committed';  // either 'committed' or 'disbursed'
				// scoreType = 'score';  // either 'score' or 'combined'

				App.newToggle('.funder-recipient-toggle', {}, () => {
						moneyFlow = 'funded';
						updatedFlags();
				}, () => {
						moneyFlow = 'received';
						updatedFlags();
				});

				$('.map-buttons button').click(function () {
						switch ($(this).data('value')) {
								case 'jee':
										indType = 'score';
										break;
								default:
										indType = 'money';
										break;
						}
						hasher.setHash(`map/map/${indType}`);
				});

				let currentSearchSelection = undefined;
				App.initCountrySearchBar('.search-box', (result) => {
						$('.country-search-input').val(result.NAME);
						currentSearchSelection = result;
						App.navigateToAnalysisPage(currentSearchSelection, moneyFlow);
				}, { isReverse: true });

				$('#profile-button').click(() => {
						App.navigateToAnalysisPage(currentSearchSelection);
				});
		};

		App.initMap = (tabSelect="countries", indTypeParam="money", params = {}) => {
				page = 'map';
				setConstants(params);
				indType = indTypeParam;

				if (tabSelect == 'org') {
					$('#org-tab').prop("checked", true);
				}

				App.loadFundingData({ showGhsaOnly: params.showGhsaOnly === 'true' });
				App.setSources();

				// build map and initialize search
				map = buildMap();
				initMapOptions();
				initGhsaToggle();
				initLegend();
				initCountryInfoBox();
				if (App.usingFirefox) {
						initFirefoxScrollBars();
				}

				updateAll();

				if (showTooltips) {
						$('.core-capacity-text').tooltipster({
								interactive: true,
								html: true,
								content: App.coreCapacitiesText,
						});

						$('.undetermined-info-img').tooltipster({
								interactive: true,
								content: 'Unreported funding amounts or in-kind support project counts may occur if the most specific funder or recipient named in a project is a general region or other group of countries.',
						});
						$('.inkind-support-info-img').tooltipster({
								interactive: true,
								content: App.inKindDefinition,
						});
						$('.combined-tooltip').tooltipster({
								interactive: true,
								content: App.combinedDefinition,
						});
				}
				initTableSearch();
				populateTables('.donor-table', '.recipient-table');

				App.fundIcon('.fund-table-title span');
				App.receiveIcon('.rec-table-title span');

				const handleToggle = (key) => {
						moneyFlow = key;

						updateFilters();


						if (activeCountry.node) {
								setTimeout(() => {
										$('.info-title').css('background-color', activeCountry.datum().color);
								}, 50);
						}
				};

				App.newToggle(
						'.funder-recipient-toggle',
						{},
						() => handleToggle('funded'),
						() => handleToggle('received'),
				);

		};


		/* ---------------------- Functions ----------------------- */

		// builds the map, attaches tooltips to countries, populates coordinates dict
		function buildMap(selector = '.map-container') {

				// add title
				d3.select(selector).append('div')
						.attr('class', 'map-title instructions')
						.text('Choose country or organization name to view details')
						.append('button')
						.attr('class', 'btn btn-primary alt-btn btn-view-ghsa map-btn btn-hidden')
						.classed('btn-hidden', !App.showGhsaOnly)
						.text('View GHSA Details')
						.on('click', function () {
								hasher.setHash('analysis/ghsa/d');
						});

				// add map to map container
				const mapObj = Map.createWorldMap(selector, App.geoData);

				if (showTooltips) {
						// define country click behavior and attach tooltips
						d3.selectAll('.country')
								.on('click', function onClick(d) {
										// set country as active
										if (activeCountry.node && activeCountry.node() === this) return resetMap();

										d3.selectAll('.country').classed('active', false);
										// activeCountry.classed('active', false);
										activeCountry = d3.select(this).classed('active', true);

										// zoom in to country
										// mapObj.zoomTo.call(this, d);
										mapObj.zoomTo(d);

										// display info box
										displayCountryInfo();

										// deselect all list items
										d3.selectAll('.list-item').classed('active', false);

										switch (moneyFlow) {
												case 'funded':
														$('.info-title').css('background-color', App.fundColorPalette[colorIndex]);
														break;
												case 'received':
														$('.info-title').css('background-color', App.receiveColorPalette[colorIndex]);
														break;
												default:
														break;
										}

										return true;
								})
								.each(function addTooltip(d) {
										$(this).tooltipster({
												plugins: ['follower'],
												delay: 100,
												minWidth: 200,
												content: d.properties.NAME,
										});
								});
				}

				// define legend display toggle behavior
				$('.legend-display-tab').click(function toggleLegendDIsplay() {
						const $arrow = $(this).find('.collapse-arrow').toggleClass('rotated');
						$(this).find('span').text($arrow.hasClass('rotated') ? 'show legend' : 'hide legend');
						$('.legend-content').slideToggle();
				});

				return mapObj;
		}

		function resetMap() {
				map.reset();
				d3.selectAll('.country, .list-item').classed('active', false);
				activeCountry = d3.select(null);
				$('.info-container').slideUp();
		}

		function getValueAttrName() {
				if (indType === 'score') {
						if (scoreType === 'combined') return 'combo';
						return 'score';
				}
				if (indType === 'inkind' && moneyType === 'committed') {
						return moneyFlow === 'funded' ? 'providedInkindCommitted' : 'receivedInkindCommitted';
				}
				if (indType === 'inkind' && moneyType === 'disbursed') {
						return moneyFlow === 'funded' ? 'providedInkindProvided' : 'receivedInkindProvided';
				}
				if (moneyFlow === 'funded') {
						return moneyType === 'committed' ? 'fundedCommitted' : 'fundedSpent';
				}
				return moneyType === 'committed' ? 'receivedCommitted' : 'receivedSpent';
		}

		function getMoneyTypeLabel(mFlow, mType, isGhsa = false) {
				let flowNoun = (mFlow === 'funded') ? '(funder)' : '(recipient)';
				if (isGhsa) {
						flowNoun = '';
				}
				let noun = '';
				let br = '<br>';
				const isInKind = indType.includes('inkind');
				if (mType === 'committed') {
						noun = 'committed';
				} else if (mType === 'disbursed') {
						if (mFlow === 'funded' && indType === 'inkind') {
								noun = 'provided';
						} else if (mFlow === 'funded' && indType !== 'inkind') {
								noun = 'disbursed';
						} else {
								noun = 'received';
						}
				} else if (mType === 'inkind') {
						noun = '';
						br = ' ';
				}
				return `Total <b>${noun}</b>` +
						`&nbsp;from ${br}${startYear} to ${endYear - 1}` +
						`&nbsp;${flowNoun}`;
		}

		/**
		 * Returns the color series that should be used in the scaleQuantile range
		 * based on what metric was currently selected.
		 * @param  {string} indType The indicator type, either money, other, or score
		 * @return {array}         Array of HEX strings representing a color series.
		 */
		function getRangeColors(indType) {
				if (indType == 'score' && scoreType == 'combined') {
						return App.combinedColors;
				}
				if (moneyFlow === 'received') {
						return App.receiveColorPalette;
				} else if (moneyFlow === 'funded') {
						return App.fundColorPalette;
				}
		}

		// gets the color scale used for the map
		function getColorScale() {
				if (indType === 'score' && scoreType === 'score') {
						return d3.scaleThreshold()
								.domain([1.5, 2, 2.5, 3, 3.5, 4, 4.5])
								.range(App.jeeColors);
				} else if (indType === 'inkind') {
						return d3.scaleThreshold()
								.domain([5, 10, 15, 20, 25, 30])
								// .domain([10,20,30,40,50,60])
								.range(getRangeColors(indType));
				}

				const valueAttrName = getValueAttrName();
				const rangeColors = getRangeColors(indType);
				const domain = currentNodeDataMap.values()
						.map(d => d[valueAttrName])
						.filter(d => d);
				if (domain.length === 1) domain.push(0);
				return d3.scaleQuantile()
						.domain(domain)
						.range(rangeColors);
		}

		// update everything if any parameters change
		function updateAll(drawLegend = true) {
				// update funding data
				App.loadFundingData({ showGhsaOnly: App.showGhsaOnly });

				// update data map and actual map
				updateDataMaps();
				updateMap(drawLegend);

				// update info box if showing
				if ($('.info-container').is(':visible')) {
						displayCountryInfo();
				}
		}

		function updateTables() {
				populateTables('.donor-table', '.recipient-table');
		}


		function getUnspecAmountCounts(iso2) {
				const funderIsMulti = true; // TODO by checking if it's EU-like
				const recipientIsMulti = true; // TODO by checking if it's Southeast Asia-like
				const unspecAmounts = {
						received: {
								committed: 0,
								spent: 0,
						},
						funded: {
								committed: 0,
								spent: 0,
						},
				};

				// if (funderIsMulti) {

				// }
				return {}; // TODO
		}

		// updates the country to value data map based on user settings
		function updateDataMaps(selector ='.cc-select') {
				// get filter values
				const ccs = $(selector).val() || _.clone(App.capacities);

				// clear out current data
				currentNodeDataMap.clear();

				// build data map; filter and only use data with valid country values
				App.countries.forEach((c) => {
						const filterCountOnce = (allProjects) => {
								const groupedById = _.groupBy(allProjects, 'project_id');
								return _.values(groupedById).map(d => d[0]);
						};

						const paymentsFunded = (App.fundingLookup[c.ISO2] === undefined) ? undefined : App.getMappableProjects(App.fundingLookup[c.ISO2], 'd', c.ISO2);
						const paymentsReceived = (App.recipientLookup[c.ISO2] === undefined) ? undefined : App.getMappableProjects(App.recipientLookup[c.ISO2], 'r', c.ISO2);
						// const paymentsFunded = (App.fundingLookup[c.ISO2] === undefined) ? undefined : App.getFinancialProjectsWithAmounts(App.fundingLookup[c.ISO2], 'd', c.ISO2)
						// const paymentsReceived = (App.recipientLookup[c.ISO2] === undefined) ? undefined : App.getFinancialProjectsWithAmounts(App.recipientLookup[c.ISO2], 'r', c.ISO2)

						const scoreObj = App.scoresByCountry[c.ISO2];

						// only include country in data map if it has a score or rec/don funds
						let fundedCommitted = 0;
						let fundedSpent = 0;
						// let providedInkind = 0;
						let receivedCommitted = 0;
						let receivedSpent = 0;
						// let receivedInkind = 0;
						let receivedInkindProvided = 0;
						let receivedInkindCommitted = 0;
						let providedInkindProvided = 0;
						let providedInkindCommitted = 0;
						let score = null;
						let combo = null;
						let receivedUnspecAmount = 0;
						let fundedUnspecAmount = 0;

						// Tabulate projects with DFS that had unspecified amount because
						// they were funded or received by a "region" (e.g., EU or Southeast Asia)
						// Get full list of projects for this funder/recipient
						// const allProjects = [].concat(paymentsFunded).concat(paymentsReceived).filter(d => d);
						const unspecAmounts = getUnspecAmountCounts(c.ISO2);

						if (paymentsFunded !== undefined) {
								({
										totalCommitted: fundedCommitted,
										totalSpent: fundedSpent,
										totalInkindCommitted: providedInkindCommitted,
										totalInkindProvided: providedInkindProvided,
								} =
										getPaymentSum(paymentsFunded, ccs));
						}
						if (paymentsReceived !== undefined) {
								({
										totalCommitted: receivedCommitted,
										totalSpent: receivedSpent,
										totalInkindCommitted: receivedInkindCommitted,
										totalInkindProvided: receivedInkindProvided,
								} =
										getPaymentSum(paymentsReceived, ccs));
						}

						if (scoreObj !== undefined) {
								const capScores = scoreObj.avgCapScores
										.filter(d => ccs.includes(d.capId));
								score = d3.mean(capScores, d => d.score);
								const numerator = 10 + Math.log10(1 + receivedSpent);
								const denominator = 5.01 - score;
								combo = numerator / denominator;
						}

						// set in node map
						currentNodeDataMap.set(c.ISO2, {
								fundedCommitted,
								fundedSpent,
								providedInkindCommitted,
								providedInkindProvided,
								receivedCommitted,
								receivedSpent,
								receivedInkindCommitted,
								receivedInkindProvided,
								score,
								combo,
						});
				});
				// initLeftList('.non-country-list.funder-list', ccs);
				// initRightList('.non-country-list.recipient-list', ccs);
				// initListScaling('.non-country-list-container.right');
				// initListScaling('.non-country-list-container.left');
		}

		// gets the sum of payments for the years and capacities selected
		function getPaymentSum(payments, ccs, params = {}) {
				let totalCommitted = 0;
				let totalSpent = 0;
				let totalInkindCommitted = 0;
				let totalInkindProvided = 0;
				let allUnspecFinancial = true;
				let allUnspecInkindCommitted = true;
				let allUnspecInkindProvided = true;
				let allUnspecInkind = true;

				for (let i = 0, n = payments.length; i < n; i++) {
						const p = payments[i];

						// filter by core category
						if (!App.passesCategoryFilter(p.core_capacities, ccs)) {
							continue;
						}

						// add payment values by year
						for (let k = startYear; k < endYear; k++) {
								totalCommitted += p.committed_by_year[k] || 0;
								totalSpent += p.spent_by_year[k] || 0;
						}

						// get inkind values for those that are inkind
						if (p.assistance_type.toLowerCase() === 'in-kind support' || p.assistance_type.toLowerCase() === 'other support') {
								const withinYears = p.years.some(year => {
										return year <= endYear && year >= startYear;
								});
								if (withinYears) {
										if (p.commitment_disbursements === 'commitment') {
												totalInkindCommitted += withinYears ? 1 : 0;
										} else if (p.commitment_disbursements === 'disbursement') {
												totalInkindProvided += withinYears ? 1 : 0;
										}
								}
						}
				}
				return { totalCommitted, totalSpent, totalInkindCommitted, totalInkindProvided };
		}

		/**
		 * Returns the correct info label text based on whether an entity is
		 * a country, the GHSA conceptual entity, and which money flow.
		 * @param  {Boolean} isGhsa        Is the entity the GHSA catch-all? If so, no label.
		 * @param  {string}  moneyFlow     The money flow, either 'funded' or 'received'
		 * @return {string}  The correct text to use as the info label in the map modal.
		 */
		function getInfoLabel(isGhsa, moneyFlow) {
				if (isGhsa) {
						return '';
				} else {
						return (moneyFlow === 'funded') ? 'Funder Information' : 'Recipient Information';
				}
		};


		// updates map colors and country tooltip
		function updateMap(updateLegendFlag = true) {
				const valueAttrName = getValueAttrName();
				const colorScale = getColorScale();

				// color countries and update tooltip content
				map.chart
						.selectAll('.country')
						.transition()
						.duration(500)
						.style('fill', function (d) {
								const country = d3.select(this);
								country.classed('hatch', false);
								d.undetermined = false;
								const isoCode = d.properties.ISO2;
								if (currentNodeDataMap.has(isoCode)) {
										d.value = currentNodeDataMap.get(isoCode)[valueAttrName];
										if (d.value && d.value !== 0) {
												d.color = d.value ? colorScale(d.value) : '#ccc';
										} else if (indType !== 'score' && indType !== 'combo') {
												// check whether to make it dark gray
												if (indType !== 'inkind') {
														const flow = valueAttrName.includes('received') ? 'r' : 'd';
														const type = valueAttrName.includes('Comm') ? 'total_committed' : 'total_spent';
														const unmappableFinancials = App.getFinancialProjectsWithUnmappableAmounts(App.fundingData, flow, d.properties.ISO2);
														if (unmappableFinancials.length > 0) {
																const someMoney = true;
																if (someMoney) {
																		country.classed('hatch', true);
																		d.undetermined = true;

																		// Get tooltip text
																		d.undetermined_message = App.getNotReportedMessage(unmappableFinancials, d.properties.NAME, flow);
																		return unspecifiedGray;
																}
														}
												} else {
														const flow = valueAttrName.includes('received') ? 'r' : 'd';
														const type = valueAttrName.includes('Comm') ? 'total_committed' : 'total_spent';
														const unmappableFinancials = App.getInkindProjectsWithUnmappableAmounts(App.fundingData, flow, d.properties.ISO2);
														if (unmappableFinancials.length > 0) {
																country.classed('hatch', true);
																d.undetermined = true;
																// Get tooltip text
																d.undetermined_message = App.getNotReportedMessage(unmappableFinancials, d.properties.NAME, flow);
																return unspecifiedGray;
														}
												}
												d.color = '#ccc';
										} else {
												d.color = '#ccc';
										}
								} else {
										d.value = null;
										d.color = '#ccc';
								}

								return d.color;
						})
						.each(function updateTooltip(d) {
								if (showTooltips) {
										// define labels and value to be shown
										let label = getMoneyTypeLabel(moneyFlow, moneyType);
										let value = d.value;

										let format = getValueFormat(indType);
										if (d.undetermined === true) {
												// format = (indType === 'inkind') ? (val) => { return 'Unspecified Value' + ` <br><span class="inkind-value">in-kind support project${val !== 1 ? 's' : ''}</span>`; } : () => { return 'Unspecified Value';};
												format = (d) => {
														return d.undetermined_message;
												};
										}


										// value shows received if showing JEE score
										if (indType === 'score') {
												label = getMoneyTypeLabel('received', 'disbursed');
												if (currentNodeDataMap.has(d.properties.ISO2)) {
														value = currentNodeDataMap.get(d.properties.ISO2).receivedSpent;
												}
										}
										// build tooltip
										const container = d3.select(document.createElement('div'));
										container.append('div')
												.attr('class', 'tooltip-title info-box')
												.text(d.properties.NAME);
										if (d.undetermined !== true) {
												if (indType === 'score') {
														let scoreText = 'Avg. JEE score: ';
														let score = 0;
														if (currentNodeDataMap.has(d.properties.ISO2)) {
																score = currentNodeDataMap.get(d.properties.ISO2).score;
														}
														if (score) {
																scoreText = App.getScoreNameHtml(score);
														} else {
																scoreText = 'No JEE score data available';
														}
														container.append('div')
																.attr('class', 'tooltip-score-text')
																.html(scoreText);
												}
												container.append('div')
														.attr('class', 'tooltip-main-value')
														.html(format(value));
												container.append('div')
														.attr('class', 'tooltip-main-value-label')
														.html(label);
										} else {
												container.append('div')
														.attr('class', 'undetermined-value info-value')
														.text(d.undetermined_message);
												container.append('div')
														.attr('class', 'undetermined-value-label info-value-label')
														.text('Specific amounts not indicated');
										}

										$(this).tooltipster('content', container.html());
								}
						});

				// update legend
				if (updateLegendFlag) {
						updateLegend(colorScale);
				}
		}

		// initialize the legend
		function initLegend() {
				const legend = d3.select('.legend g');

				// add starting label
				legend.append('text')
						.attr('class', 'legend-start-label')
						.attr('dy', '.35em');

				// add starting tick line
				legend.append('line')
						.attr('class', 'legend-start-tick legend-tick')
						.attr('x1', 1)
						.attr('x2', 1);

				// add legend title
				legend.append('text').attr('class', 'legend-title');
		}

		/**
		 * Returns the thresholds that should be used to label the legend categories
		 * for the map metric.
		 * @param  {string} indType The indicator type, either money, other, or score
		 * @param  {func} colorScale The D3 color scale for the metric
		 * @return {array}         The labels for the legend categories (numeric)
		 */
		function getLegendThresholds(indType, colorScale) {
				if (indType === 'score' || indType === 'inkind') {
						return colorScale.domain();
				} else {
						return colorScale.quantiles();
				}
		}

		// update the map legend
		function updateLegend(colorScale) {
				const valueAttrName = getValueAttrName();
				const isJeeScore = (indType === 'score' && scoreType === 'score');
				const isOther = indType === 'inkind';
				const needHatch = indType === 'inkind' || indType === 'money';

				const barHeight = 16;
				let barWidth = 70;
				// barWidth = 20;
				const legendPadding = 25;

				// adjust width for JEE score
				if (isJeeScore) barWidth = 50;

				const colors = colorScale.range();
				if (needHatch) colors.push('black');
				const thresholds = getLegendThresholds(indType, colorScale);
				const maxValue = d3.max(currentNodeDataMap.values()
						.map(d => d[valueAttrName]));

				const hatchSpacing = needHatch ? 1 : 0;

				const legend = d3.select('.legend')
						.attr('width', barWidth * colors.length + 2 * legendPadding + barWidth * hatchSpacing)
						.attr('height', barHeight + 50)
						.select('g')
						.attr('transform', `translate(${legendPadding}, 0)`);
				legend.selectAll('g').remove();
				let legendGroups = legend.selectAll('g.legend-bar-group')
						.data(colors);
				legendGroups.exit().remove();

				// add bars, texts, ticks for each group
				const newLegendGroups = legendGroups.enter().append('g');
				newLegendGroups.append('rect')
						.attr('class', 'legend-bar')
						.attr('height', barHeight);
				newLegendGroups.append('text')
						.attr('class', 'legend-text')
						.attr('dy', '.35em');
				newLegendGroups.append('line')
						.attr('class', 'legend-tick')
						.attr('y1', barHeight)
						.attr('y2', barHeight + 4);

				legendGroups = legendGroups.merge(newLegendGroups)
						.attr('transform', (d, i) => `translate(${barWidth * i}, 0)`);
				legendGroups.select('.legend-bar')
						.attr('width', barWidth)
						.style('fill', d => d);
				const legendText = legendGroups.select('.legend-text')
						.attr('x', barWidth)
						.attr('y', isJeeScore ? barHeight + 14 : barHeight + 12);
				legendGroups.select('.legend-tick')
						.attr('x1', (d, i) => (i === colors.length - 2 ? 2 * barWidth - 1 : 2 * barWidth))
						.attr('x2', (d, i) => (i === colors.length - 2 ? 2 * barWidth - 1 : 2 * barWidth))
						.style('display', (d, i) => {
								if (!isJeeScore) return 'none';
								return (i % 2 === 0) ? 'inline' : 'none';
						});


				// fix starting label position
				const legendStartLabel = legend.select('.legend-start-label')
						.attr('y', barHeight + 12);

				// add starting tick
				legend.select('.legend-start-tick')
						.attr('y1', barHeight)
						.attr('y2', barHeight + 4)
						.style('display', isJeeScore ? 'inline' : 'none');

				if (isJeeScore) {
						legendText
								.style('text-anchor', 'middle')
								.style('display', (d, i) => (i % 2 === 0 ? 'none' : 'inline'))
								.text((d, i) => (i + 3) / 2);
						legendStartLabel
								.style('text-anchor', 'middle')
								.text('1');
				} else if (indType === 'score' && scoreType === 'combined') {
						legendText
								.style('display', 'inline')
								.style('text-anchor', 'end')
								.text((d, i) => {
										if (i === 6) return 'Needs met';
										return '';
								});
						legendStartLabel
								.style('text-anchor', 'start')
								.text('Needs unmet');
				} else if (indType === 'inkind') {
						legendText
								.style('display', 'inline')
								.style('text-anchor', 'middle')
								.text((d, i) => {
										// if (i === thresholds.length) return Util.comma(maxValue);
										return Util.comma(thresholds[i]);
								});
						legendStartLabel
								.style('text-anchor', 'start')
								.text(0);
				} else {
						legendText
								.style('display', 'inline')
								.style('text-anchor', 'middle')
								.text((d, i) => {
										if (i === thresholds.length) return App.formatMoneyShort(maxValue);
										return App.formatMoneyShort(thresholds[i]);
								});
						legendStartLabel
								.style('text-anchor', 'start')
								.text(0);
				}

				// update legend title
				let titleText = '';
				if (indType === 'money' || indType === 'ghsa') {
						if (moneyType === 'committed') {
								titleText = 'Funds committed';
						} else {
								if (moneyFlow === 'funded') {
										titleText = 'Funds disbursed';
								} else {
										titleText = 'Funds received';
								}
						}
						titleText += ` (in ${App.currencyIso})`;
				} else if (indType === 'score') {
						if (scoreType === 'score') {
								titleText = 'Average JEE score for selected Core Capacities';
						} else if (scoreType === 'combined') {
								titleText = 'Financial resources / needs metric';
						}
				} else if (indType === 'inkind') {
						if (moneyType === 'committed') {
								titleText = 'In-kind support projects committed';
						} else {
								if (moneyFlow === 'funded') {
										titleText = 'In-kind support projects provided';
								} else {
										titleText = 'In-kind support projects received';
								}
						}
				}


				// legend.select('.hatch-legend-group').remove();
				// legend.append('g')
				// 	.attr('class','hatch-legend-group')
				// 	.attr('transform', `translate(${barWidth * (colors.length)}, 0)`);

				legend.select('.legend-title')
						.attr('x', (barWidth * colors.length + barWidth * hatchSpacing) / 2)
						// .attr('x', barWidth * colors.length / 2)
						.attr('y', barHeight + 45)
						.text(titleText);

				if (needHatch) {
						const undetermined = d3.select('.legend-group').select('g:last-child');
						undetermined
								.attr('transform', `translate(${barWidth * hatchSpacing + (barWidth * (colors.length - 1))}, 0)`);
						undetermined.select('text')
								.attr('x', barWidth / 2)
								.text('Unspecified value');
						const rectMask = undetermined.select('rect')
								.attr('class', 'mask-bar');
						const clone = Util.clone_d3_selection(rectMask, 1)
								.attr('mask', 'url(#mask-stripe)')
								.style('fill', unspecifiedGray);

				}

				$('.legend-container').slideDown();
		}

		// displays detailed country information
		function displayCountryInfo() {
				const countryTmp = activeCountry.datum();
				const country = countryTmp.properties;
				const flowTmp = countryTmp.flow;
				const isGhsa = country.ISO2 === 'ghsa';
				// const activeData = $('.country.active').datum() ||

				const listItemData = countryTmp.listItemData;
				const hasListItemData = listItemData !== undefined;
				const isUndetermined = $('.country.active').hasClass('hatch') || (hasListItemData && listItemData.undetermined === true);

				if (isUndetermined) {
						$('.c-and-d').slideUp();

						// set undetermined message
						const adjective = moneyFlow === 'received' ? 'received' : 'disbursed';

						let message = '';
						if (hasListItemData) {
								message = listItemData.undetermined_message;
						} else {
								message = d3.select('.country.active').datum().undetermined_message;
						}
						// const message = d3.select('.country.active').datum().undetermined_message || '';

						$('.undetermined-value').text(message);
						$('.undetermined-unit').text('');
						$('.undetermined-value-label').text('Specific amounts not indicated.');
						// $('.undetermined-unit').text(indType === 'inkind' ? 'in-kind support projects' : `funds committed or ${adjective}`);

						$('.undetermined').slideDown();
				} else {
						$('.c-and-d').slideDown();
						$('.undetermined').slideUp();
				}

				// determine which flow to show in tooltip
				const flowToShow = (flowTmp !== undefined) ? flowTmp : moneyFlow;

				// populate info title
				$('.info-title').text(country.NAME);
				setTimeout(() => {
						$('.info-title').css('background-color', countryTmp.color);
				}, 50);


				if (country.ISO2 === 'ghsa') {
						d3.select('.info-title').append('img')
								.attr('class', 'ghsa-info-img info-img')
								.attr('src', 'img/info.png');
						$('.info-title > img.ghsa-info-img').tooltipster({
								interactive: true,
								content: App.ghsaInfoTooltipContent,
						});
				}
				$('.info-profile-type')
						.css('display', (indType === 'money' || indType === 'ghsa' || country.country === false) ? 'block' : 'none')
						.text(getInfoLabel(isGhsa, flowToShow));

				// define "go to analysis" button behavior
				$('.info-analysis-button')
						.off('click')
						.on('click', () => {
								const activeCountryData = activeCountry.datum();
								if (activeCountryData.flow !== undefined) {
										const flowParam = (activeCountryData.flow === 'funded') ? 'd' : 'r';
										hasher.setHash(`analysis/${country.ISO2}/${flowParam}`);
								} else {
										const flowParam = (flowToShow === 'funded') ? 'd' : 'r';
										hasher.setHash(`analysis/${country.ISO2}/${flowParam}`);
								}
						});

				// populate info total value
				let totalCommitted = 0;
				let totalSpent = 0;
				let totalInkindCommitted = 0;
				let totalInkindProvided = 0;
				let totalUnspecAmount = 0;
				if (currentNodeDataMap.has(country.ISO2)) {
						const valueObj = currentNodeDataMap.get(country.ISO2);
						if (indType === 'money' || indType === 'ghsa' || indType === 'inkind') {
								$('.info-score-text-container').slideUp();
						} else if (indType === 'score') {
								let scoreText = 'Average JEE score: ';
								if (valueObj.score) {
										scoreText = App.getScoreNameHtml(valueObj.score);
								} else {
										scoreText = 'No JEE score data currently available';
								}
								$('.info-score-text').html(scoreText);
								if (country.country === false) {
										$('.info-score-text-container').slideUp();
								} else {
										$('.info-score-text-container').slideDown();
								}
						}
						if (flowTmp === 'funded' || ((indType === 'money' || indType === 'ghsa') && flowToShow === 'funded')) {
								totalCommitted += valueObj.fundedCommitted;
								totalSpent += valueObj.fundedSpent;
								totalInkindCommitted += valueObj.providedInkindCommitted;
								totalInkindProvided += valueObj.providedInkindProvided;
						} else {
								totalCommitted += valueObj.receivedCommitted;
								totalSpent += valueObj.receivedSpent;
								totalInkindCommitted += valueObj.receivedInkindCommitted;
								totalInkindProvided += valueObj.receivedInkindProvided;
						}
				}

				const format = (indType === 'inkind') ? (val) => {
						return Util.comma(val) + ' projects';
				} : App.formatMoney;
				if (indType === 'inkind') {
						const curEntityData = currentNodeDataMap.get(country.ISO2);
						if (flowToShow === 'funded') {
								totalCommitted = curEntityData.providedInkindCommitted;
								totalSpent = curEntityData.providedInkindProvided;
						} else {
								totalCommitted = curEntityData.receivedInkindCommitted;
								totalSpent = curEntityData.receivedInkindProvided;
						}
				}


				$('.info-committed-value').text(format(totalCommitted));
				$('.info-spent-value').text(format(totalSpent));

				// construct label for value
				const mFlow = (indType === 'score' && country.country !== false) ? 'received' : flowToShow;
				$('.info-committed-value-label').html(getMoneyTypeLabel(mFlow, 'committed', isGhsa));
				$('.info-spent-value-label').html(getMoneyTypeLabel(mFlow, 'disbursed', isGhsa));

				// display content
				$('.info-container').slideDown();
		}

		function initGhsaToggle() {
				// set GHSA radio button to checked if that is set
				const selector = 'input.ghsa-only-checkbox[type=checkbox]';
				if (App.showGhsaOnly) {
						// $('input[type=radio][name="ind"][ind="ghsa"]').prop('checked',true);
						$(selector).prop('checked', true);
				}

				$(selector).off('change');
				$(selector).change(() => {
						if ($(selector).prop('checked')) {
								App.showGhsaOnly = true;
						} else {
								App.showGhsaOnly = false;
						}
						d3.select('.map-btn').classed('btn-hidden', !App.showGhsaOnly);
						updateFilters();
				});
		}

		// initalizes components in the map options, incl. search and display toggle
		function initMapOptions() {
				// define display toggle behavior
				$('.map-options-title.main-options-title').click(function toggleContent() {
						$(this).find('.collapse-arrow').toggleClass('rotated');
						$('.map-options-content').slideToggle();
				});

				// initialize components
				initFilters();
				initOrgFilters();
				initSlider('.time-slider');
				initOrgSlider();
				initSearch('.search-container');
		}

		// initializes search functionality
		function initSearch(selector = '.search-container') {
				App.initCountrySearchBar(selector, (result) => {
						if (result.item !== undefined) result = result.item;
						d3.selectAll('.country, .list-item').classed('active', false);

						$('input.country-search-input').val(result.NAME);
						// get country element
						const nonCountry = result.country === false;
						let match;
						if (!nonCountry) {
								match = d3.selectAll('.country')
										.filter(c => {
												if (!c.properties) return false;
												return result.ISO2 === c.properties.ISO2;
										});
						} else {
								d3.selectAll('.list-item');

								const matchTmp = d3.selectAll('.list-item')
										.filter(c => result.ISO2 === c.donor_code);
								// .filter(c => result.ISO2 === c.entity_data.ISO2);
								const entityData = App.countries.find(d => d.ISO2 === matchTmp.datum().donor_code);
								// const entityData = matchTmp.datum().entity_data;
								match = matchTmp;
								match.datum = () => {
										return {
												properties: entityData,
												flow: 'funded',
										};
								};
						}

						// set country as active
						activeCountry = match.classed('active', true);

						// zoom in to country
						if (!nonCountry) {
								map.zoomTo(activeCountry.node());
						} else {
								scrollToListItem(activeCountry);
						}
						;
						displayCountryInfo();
				}, { isReverse: true });
		}

		// initializes slider functionality
		function initSlider(tag) {
				const slider = App.initSlider(tag, {
						min: App.dataStartYear,
						max: App.dataEndYear + 1,
						value: [startYear, endYear],
						tooltip: 'hide',
				});
				slider.on('change', (event) => {
						const years = event.target.value.split(',');
						if (+years[0] !== startYear || +years[1] !== endYear) {
								startYear = +years[0];
								endYear = +years[1];

								updateAll();
						}
				});
				return slider;
		}

		// initializes slider functionality
		function initOrgSlider() {
				const slider = App.initSlider('.org-time-slider', {
						min: App.dataStartYear,
						max: App.dataEndYear + 1,
						value: [orgStartYear, orgEndYear],
						tooltip: 'hide',
				});
				slider.on('change', (event) => {
						const years = event.target.value.split(',');
						if (+years[0] !== orgStartYear || +years[1] !== orgEndYear) {
								orgStartYear = +years[0];
								endYear = +years[1];
								updateTables();
						}
				});
				return slider;
		}

		// populates and initializes behavior for map options
		function initFilters() {
				// populate dropdowns
				// App.populateCcDropdown('.cc-select', { dropRight: true });
				App.populateCcDropdown('.cc-select', { dropUp: true, dropLeft: true });

				d3.select('.dropdown-menu').classed('firefox', App.usingFirefox);

				// The map page handles a indTypeParam. Update the filter to match it.
				$(`input[name="ind"][ind="${indType}"]`).prop('checked', true);
				if (indType === 'score' || indType === 'combined') {
						$('.money-filters').slideUp();
						$('.score-filters').slideDown();
						if (indType == 'combined') {
								indType = 'score';
								scoreType = 'combined'
						} else {
								scoreType = 'score';
						}
				}

				// update indicator type ('money' or 'score') on change
				$('.ind-type-filter .radio-option').click(function updateIndType() {
						indType = $(this).find('input').attr('ind');
						if (indType === 'money' || indType === 'inkind') {
								$('.score-filters').slideUp();
								$('.money-filters').slideDown();
								// App.showGhsaOnly = false;
						} else if (indType === 'ghsa') {
								$('.score-filters').slideUp();
								$('.money-filters').slideDown();
								App.showGhsaOnly = true;
						} else if (indType === 'score' || indType === 'combined') {
								$('.money-filters').slideUp();
								$('.score-filters').slideDown();
								if (indType == 'combined') {
										indType = 'score';
										scoreType = 'combined'
								}
								else {
										scoreType = 'score';
								}
						}
						updateFilters();
				});

				// update money flow type ('funded' or 'received') on change
				$('.money-flow-type-filter .radio-option').click(function updateMoneyFlow() {
						moneyFlow = $(this).find('input').attr('ind');
						updateFilters();

						// update text in country info box based on money flow on change
						$('.info-tab-container .btn[tab="country"]')
								.text(moneyFlow === 'received' ? 'By Donor' : 'By Recipient');
				});

				// update money type ('committed' or 'disbursed') on change
				$('.money-type-filter .radio-option').click(function updateMoneyType() {
						moneyType = $(this).find('input').attr('ind');
						updateFilters();
				});

				// update score type ('score' or 'combined') on change
				$('.jee-score-filter .radio-option').click(function updateScoreType() {
						indType = 'score';
						scoreType = $(this).find('input').attr('ind');
						updateFilters();
				});

				// update map on dropdown change
				$('.map-options-container select').on('change', updateAll);

				// add info tooltips
				$('.score-info-img').tooltipster({
						interactive: true,
						content: 'The average of each country\'s most recent <b>JEE scores</b>,' +
								' for all JEE scores selected in the filter below.',
				});
				$('.combined-info-img').tooltipster({
						content: 'This metric combines both a country\'s JEE scores and ' +
								'the amount of disbursed funds that the country has received. ' +
								'We use JEE scores as a proxy for country-specific needs, ' +
								'and calculate the ratio of financial resources to need. ' +
								'The goal of this metric is to highlight areas whose needs may ' +
								'still be unmet based on their ratio of financial resources to need.',
				});
				$('.ghsa-info-img').tooltipster({
						interactive: true,
						content: App.ghsaInfoTooltipContent,
				});

				// show map options
				$('.map-options-container').show();
		}

		function updateFilters() {
				let currIndType = indType;

				if (indType === 'score' && scoreType === 'combined') {
						currIndType = 'combined';
				}
				// update indicator type radio button
				$('.ind-type-filter input').each(function updateInputs() {
						const $this = $(this);
						$this.prop('checked', $this.attr('ind') === currIndType);
				});

				// update which radio buttons are checked based on state variables
				if (indType === 'money' || indType === 'ghsa' || indType === 'inkind') {
						// uncheck score buttons
						$('.jee-score-filter input').prop('checked', false);

						// update money flow type radio buttons
						$('.money-flow-type-filter input').each(function updateInputs() {
								const $this = $(this);
								$this.prop('checked', $this.attr('ind') === moneyFlow);
						});

						// update money type radio buttons
						$('.money-type-filter input').each(function updateInputs() {
								const $this = $(this);
								$this.prop('checked', $this.attr('ind') === moneyType);
						});
				} else if (indType === 'score') {
						// uncheck money radio buttons
						$('.money-type-filter input, .money-flow-type-filter input')
								.prop('checked', false);

						// update jee radio button
						$('.jee-score-filter input').each(function updateInputs() {
								const $this = $(this);
								$this.prop('checked', $this.attr('ind') === scoreType);
						});
				}

				// update the map
				updateAll();
		}

		// populates and initializes behavior for Organization table options
		function initOrgFilters() {
				// populate dropdowns
				App.populateCcDropdown('.org-cc-select', { dropUp: false, dropLeft: false });

				// update indicator type ('money' or 'score') on change
				$('.org-ind-type-filter .org-radio-option').click(function updateOrgIndType() {
						indType = $(this).find('input').attr('org-ind');
						if (indType === 'org-money' || indType === 'org-inkind') {
								$('.commit-toggle-options').slideDown();
								App.showGhsaOnly = false;

								if (indType === 'org-money') {
										supportType = 'financial';
								}
								else {
										supportType = 'inkind';
								}
						} else if (indType === 'org-score') {
								$('.commit-toggle-options').slideUp();
						}

						updateTables();
				});

				// update money type ('committed' or 'disbursed') on change
				$('.org-money-type-filter .org-radio-option').click(function updateMoneyType() {
						orgMoneyType = $(this).find('input').attr('org-ind');
						updateTables();
				});

				// update map on dropdown change
				$('.org-cc-select').on('change', function() {
						updateTables();
				});

				// Info tooltips were added in initFilters. They are being reused here.
		}

		function initCountryInfoBox() {
				// define info close button behavior
				$('.info-close-button').on('click', resetMap);

				// populate tooltip for avg JEE score text
				$('.score-text-info-img').tooltipster({
						content: 'JEE scores are taken from each country\'s ' +
								'<a href="http://www.who.int/ihr/procedures/mission-reports/en/" target="_blank">' +
								'World Health Organization Joint External Evaluation Report</a>, when available.',
				});
		}

		/**
		 * If browser is Firefox, use jQuery NiceScroll to style the scrollbars
		 */
		function initFirefoxScrollBars() {
				$('.non-country-list.funder-list').niceScroll(
						{
								railalign: 'left',
								// scrollspeed: 500,
								autohidemode: false,
								sensitiverail: true,
								zindex: 99,
								cursorcolor: '#5a5b5b', // change cursor color in hex
								cursorwidth: '0.75em', // cursor width in pixel (you can also write "5px")
								cursorborder: 'none', // css definition for cursor border
								cursorborderradius: '3px', // border radius in pixel for cursor
								horizrailenabled: false,
						},
				);

				$('.non-country-list.recipient-list').niceScroll(
						{
								railalign: 'right',
								// scrollspeed: 500,
								autohidemode: false,
								sensitiverail: true,
								zindex: 99,
								cursorcolor: '#5a5b5b', // change cursor color in hex
								cursorwidth: '0.75em', // cursor width in pixel (you can also write "5px")
								cursorborder: 'none', // css definition for cursor border
								cursorborderradius: '3px', // border radius in pixel for cursor
								horizrailenabled: false,
						},
				);
		};

		// Function to set the horizontal offsets of the Non-country Funder/Recipient
		// list items so they flow around the elliptical viewport.
		function setHorizOffsets($list) {
				let directionSign = 1;
				if ($list.hasClass('funder-list')) {
						directionSign = -1;
				}
				const boxTop = $list.offset().top;

				function getMaxHorizOffset() {
						return 150; // TODO dynamically, if it improves rendering.
				}

				function getHorizOffsetScale() {
						const domain = {
								min: $list.first('div').position().top,
								max: $list[0].getBoundingClientRect().height,
						};
						const sineScale = Util.sineScale(domain);

						const range = {
								min: 24,
								max: getMaxHorizOffset(), // base case: linear
						};

						const horizOffsetScaleTmp = d3.scaleLinear()
								.domain([0, 1])
								.range([range.min, range.max]);

						const horizOffsetScale = (val) => {
								return horizOffsetScaleTmp(sineScale(val));
						};

						return horizOffsetScale;
				}

				function getHorizOffset(span, scrollTop) {
						const val = span.position().top;
						const scale = getHorizOffsetScale();
						const maxOffset = getMaxHorizOffset();
						// if (App.usingFirefox) return 130;
						// if (App.usingFirefox || true) return 110;
						return scale(val);
				}

				$list
						.off('scroll')
						.scroll(function (e) {
								const element = $(this);
								const scrollTop = element.scrollTop();
								const spans = element.find('div');
								spans.each(function (span) {
										const $span = $(this);
										const horizOffset = getHorizOffset($span);
										$span.css('left', (directionSign * horizOffset) + 'px');
								});
						});
				$list.trigger('scroll');
		}

		// Make the list of non-country recipients scale and position
		// so it's always next to the elliptical viewport's right edge.
		function initListScaling(selector) {
				const $box = $(selector);
				const $listTitle = $box.find('.list-title');
				const $viewport = $('.viewport-edge');
				const $list = $box.find('.non-country-list');
				const $mapAndSearchContainer = $('.map-and-search-container');
				const $countryInfoBox = $('.info-box');
				const $legendContainer = $('.legend-container');
				const $mapTitle = $('.map-title');

				// const $searchContainer = $('.search-container');

				function onChange() {
						// Scale the size of the content on this page
						// Scale factor = difference between original viewport height and current viewport height
						// const viewportHeight = $viewport[0].getBoundingClientRect().height;
						const origViewportHeight = 640;
						const heuristicScaleFactorCorrection = 1.3; // Dividing by this value gets the initial size right
						const scaleFactor = (origViewportHeight / origViewportHeight) / heuristicScaleFactorCorrection;
						$box
								.css('transform', `scale(${scaleFactor})`)
								.css('-moz-transform', `scale(${scaleFactor})`);

						$mapAndSearchContainer.css('transform', `scale(${scaleFactor})`);
						$countryInfoBox.css('transform', `scale(${scaleFactor})`);
						$legendContainer.css('transform', `scale(${scaleFactor})`);
						$mapTitle.css('transform', `scale(${scaleFactor})`);

						$box
								.css('transform', `scale(${scaleFactor})`)
								.css('-moz-transform', `scale(${scaleFactor})`);

						// Calculate the new position of the box and the map title tops
						// const viewportTop = $viewport.offset().top + 20;
						const boxHeight = $box[0].getBoundingClientRect().height;
						const listTitleHeight = $listTitle[0].getBoundingClientRect().height;
						const heuristicTopPositionCorrection = -10 * scaleFactor / heuristicScaleFactorCorrection;
						const yShift = 0;
						const top = origViewportHeight + yShift;

						// Set the positions of the box and the map title tops
						$box.css('top', top + 'px');
						$mapTitle.css('top', (origViewportHeight + heuristicTopPositionCorrection - 40) + 'px');

						// Set indentations of 'span' elements of list
						setHorizOffsets($list);
				}

				onChange();
				setHorizOffsets($list);
				window.addEventListener('resize', onChange);
		}

		function setDotPosition(circleNode) {
				const lineHeight = parseFloat(window.getComputedStyle(circleNode.parentNode.parentNode.parentNode)['line-height']);
				const parentHeight = circleNode.parentNode.parentNode.parentNode.offsetHeight;
				const factor = (parentHeight / lineHeight) - 1;
				const circlePosScale = d3.scaleLinear()
						.domain([1, 4])
						.range([-15 - 6, -42 - 6 - 6]);

				if (App.usingFirefox) {
						function getTop(factor) {
								// factor = Math.round(factor);
								return circlePosScale(factor);
								if (factor === 1) return '-15px';
								if (factor === 2) return '-24px';
								if (factor === 3) {
										return '-33px';
								} else {
										return '-42px';
								}
						}
				} else {
						function getTop(factor) {
								return circlePosScale(factor);
								if (factor === 1) return '-15px';
								if (factor === 2) return '-24px';
								if (factor === 3) {
										return '-33px';
								} else {
										return '-42px';
								}
						}
				}
				$(circleNode.parentNode.parentNode).css('top', getTop(factor));
		}

		/**
		 * hatch status of circles to left and right of map
		 * @param  {obj} d Entity data (country style)
		 * @return {[type]}   [description]
		 */
		function checkHatchStatus(d, $item, colorScale) {
				const country = $item;
				country.classed('hatch', false);
				d.undetermined = false;
				const isoCode = d.donor_code;
				const valueAttrName = getValueAttrName();
				// const isoCode = d.properties.ISO2;
				if (currentNodeDataMap.has(isoCode)) {
						d.value = currentNodeDataMap.get(isoCode)[valueAttrName];

						if (d.value && d.value !== 0) {
								d.color = d.value ? colorScale(d.value) : '#ccc';
						} else if (indType !== 'score' && indType !== 'combo') {
								// check whether to make it dark gray
								if (indType !== 'inkind') {
										const flow = valueAttrName.includes('received') ? 'r' : 'd';
										const type = valueAttrName.includes('Comm') ? 'total_committed' : 'total_spent';
										const unmappableFinancials = App.getFinancialProjectsWithUnmappableAmounts(App.fundingData, flow, isoCode);
										if (unmappableFinancials.length > 0) {
												// const someMoney = d3.sum(unmappableFinancials, d => d.total_spent + d.total_committed) > 0;
												if (true) {
														country.classed('hatch', true);
														d.undetermined = true;

														// Get tooltip text
														d.undetermined_message = App.getNotReportedMessage(unmappableFinancials, d.donor_name, flow);
														return unspecifiedGray;
												}
										}
								} else {
										const flow = valueAttrName.includes('received') ? 'r' : 'd';
										const type = valueAttrName.includes('Comm') ? 'total_committed' : 'total_spent';
										const unmappableFinancials = App.getInkindProjectsWithUnmappableAmounts(App.fundingData, flow, isoCode);
										if (unmappableFinancials.length > 0) {
												country.classed('hatch', true);
												d.undetermined = true;
												// Get tooltip text
												d.undetermined_message = App.getNotReportedMessage(unmappableFinancials, d.donor_name, flow);
												return unspecifiedGray;
										}
								}
								d.color = '#ccc';
						} else {
								d.color = '#ccc';
						}
				} else {
						d.value = null;
						d.color = '#ccc';
				}

				return d.color;
		}

		/**
		 * Initializes the list of funders that appears on the left side of the Map.
		 * @param  {string} selector      D3 selector string of div that
		 *                                  contains the list of funders
		 *
		 * @return {null} No return value
		 */
		function initLeftList(selector, ccs = []) {
				const $list = d3.select(selector).html('');
				const label = 'Non-government Organization ';
				const dNounPlural = indType === 'inkind' ? 'providers' : 'funders';
				d3.select('.list-title.left').html(label + (moneyFlow === 'funded' ? dNounPlural : 'Recipients'));
				const dFlow = indType === 'inkind' ? 'Provided' : 'Funded';
				const dType = indType === 'inkind' ? 'Sent' : 'Disbursed';
				$('.d-flow span').text(dFlow);
				$('.d-type span').text(dType);


				// get data for funders and group it by funder
				const curFundingData = App.fundingData.filter(p => {

						// Tagged with right ccs?
						if (!App.passesCategoryFilter(p.core_capacities, ccs)) return false;
						return true;

				});

				// checking funder or recipient?
				const sectorField = moneyFlow === 'funded' ? 'donor_code' : 'recipient_country';

				// get funding data grouped by sector
				const dataBySector = _.groupBy(curFundingData, sectorField);

				// get codes of orgs needed by the sectors needed
				const sectors = [
						'International NGO',
						'Multilateral',
						'National NGO',
						// 'Public Private Partnership',
				];

				// keep only the data that match the needed sector
				let orgs = App.codes.filter(org => {
						return sectors.indexOf(org.donor_sector) > -1;
				});

				// keep only F/R with non-zero funds of the type being checked (r or d, com or dis, IKS or DFS)
				const lookup = moneyFlow === 'funded' ? App.fundingLookup : App.recipientLookup;
				orgs = orgs.filter(org => {
						const code = org.donor_code;
						const projects = lookup[code];
						if (projects === undefined || projects.length === 0) return false;
						org.curPayments = getPaymentSum(projects, ccs, { moneyFlow }); // TODO don't check ccs twice
						const values = _.values(org.curPayments);
						if (values.some(d => d > 0)) {
								return true;
						} else {
								return false;
						}
				});

				// sort them by amount of funds
				const isFinancial = indType !== 'inkind';
				const financialField = moneyType === 'committed' ? 'totalCommitted' : 'totalSpent';

				const inKindField = moneyType === 'committed' ? 'totalInkindCommitted' : 'totalInkindProvided';
				let sortField = isFinancial ? financialField : inKindField; // TODO committed or disbursed IKS

				orgs = _.sortBy(orgs, d => d.curPayments[sortField]).reverse();


				// If IKS, filter out orgs that don't provide it
				// if (!isFinancial) {
				orgs = orgs.filter(d => d.curPayments[sortField] > 0);
				// }

				// populate the list with spans representing each entity
				const colorScale = getColorScale();

				// if (indType !== 'inkind') {
				// 				const flow = valueAttrName.includes('received') ? 'r' : 'd';
				// 				const type = valueAttrName.includes('Comm') ? 'total_committed' : 'total_spent';
				// 				const unmappableFinancials = App.getFinancialProjectsWithUnmappableAmounts(App.fundingData,flow,d.properties.ISO2)
				// 				if (unmappableFinancials.length > 0) {
				// 					const someMoney = true;
				// 					if (someMoney) {
				// 						country.classed('hatch', true);
				// 						d.undetermined = true;

				// 						// Get tooltip text
				// 						d.undetermined_message = App.getNotReportedMessage(unmappableFinancials, d.properties.NAME, flow);
				// 						return unspecifiedGray;
				// 					}
				// 				}
				// 			} else {
				// 				const flow = valueAttrName.includes('received') ? 'r' : 'd';
				// 				const type = valueAttrName.includes('Comm') ? 'total_committed' : 'total_spent';
				// 				const unmappableFinancials = App.getInkindProjectsWithUnmappableAmounts(App.fundingData,flow,d.properties.ISO2)
				// 				if (unmappableFinancials.length > 0) {
				// 					country.classed('hatch', true);
				// 					d.undetermined = true;
				// 					// Get tooltip text
				// 					d.undetermined_message = App.getNotReportedMessage(unmappableFinancials, d.properties.NAME, flow);
				// 					return unspecifiedGray;
				// 				}
				// 			}

				if (orgs.length > 0) {
						$list.selectAll('.list-item')
								.data(orgs).enter().append('div')
								.attr('class', 'list-item')
								.text(d => d.donor_name)
								// .style('color',function(d) { return colorScale(d.curPayments[sortField])})
								.on('click', function onClick(d) {
										const curListItem = d3.select(this);
										if (curListItem.classed('active')) {
												d3.selectAll('.list-item').classed('active', false);
												return resetMap();
										} else if ($('.list-item.active').length === 0) {
												map.reset();
										}

										d3.selectAll('.list-item').classed('active', false);
										curListItem.classed('active', true);

										activeCountry = {
												datum: () => {
														return {
																listItemData: d,
																flow: moneyFlow,
																properties: App.nonCountries.find(dd => d.donor_code === dd.FIPS),
														};
												},
										};

										// display info box
										displayCountryInfo();
										return true;
								})
								.style('fill', function (d) {
										checkHatchStatus(d, d3.select(this), colorScale);
										return 'green;';
								})
								// .each(d => {checkHatchStatus(d, colorScale)})
								.insert('div')
								.attr('class', 'circle-container left')
								.append('svg')
								.attr('width', '12')
								.attr('height', '12')
								.append('circle')
								.attr('r', 6)
								.attr('cx', 6)
								.attr('cy', 6)
								// .classed('hatch',true)
								.style('fill', d => {
										if (d.curPayments[sortField] === 0) return 'red';
										// if (d.curPayments[sortField] === 0) return 'rgb(204, 204, 204)';
										return colorScale(d.curPayments[sortField]);
								})
								.each(function () {
										setDotPosition(this);
								});
						// .insert('br');
				} else {
						$list.append('div')
								.attr('class', 'list-item no-data')
								.text(`No ${moneyFlow === 'funded' ? 'funders' : 'recipients'} to show. Change options in bottom right to view data.`);
				}

		};

		/**
		 * Initializes the list of philanthropies and foundations that appears on the right side of the Map.
		 * @param  {string} selector      D3 selector string of div that
		 *                                  contains the list of recipients
		 *
		 * @return {null} No return value
		 */
		function initRightList(selector, ccs = []) {

				const $list = d3.select(selector).html('');
				const label = 'Foundations, Philanthropies, and Private Sector';
				const dNounPlural = indType === 'inkind' ? 'providers' : 'funders';
				d3.select('.list-title.right').text(label + (moneyFlow === 'funded' ? ' ' + dNounPlural : ' Recipients'));

				// get data for funders and group it by funder
				const curFundingData = App.fundingData.filter(p => {

						// Tagged with right ccs?
						if (!App.passesCategoryFilter(p.core_capacities, ccs)) return false;
						return true;

				});

				// checking funder or recipient?
				const sectorField = moneyFlow === 'funded' ? 'donor_code' : 'recipient_country';

				// get funding data grouped by sector
				const dataBySector = _.groupBy(curFundingData, sectorField);

				// get codes of orgs needed by the sectors needed
				const sectors = [
						'Philanthropy',
						'Foundation',
						'Private Sector',
						'Academic, Training and Research',
				];

				// keep only the data that match the needed sector
				let orgs = App.codes.filter(org => {
						return sectors.indexOf(org.donor_sector) > -1;
				});

				// keep only F/R with non-zero funds of the type being checked (r or d, com or dis, IKS or DFS)
				const lookup = moneyFlow === 'funded' ? App.fundingLookup : App.recipientLookup;
				orgs = orgs.filter(org => {
						const code = org.donor_code;
						const projects = lookup[code];
						if (projects === undefined || projects.length === 0) return false;
						org.curPayments = getPaymentSum(projects, ccs); // TODO don't check ccs twice
						const values = _.values(org.curPayments);
						if (values.some(d => d > 0)) {
								return true;
						} else {
								return false;
						}
				});

				// sort them by amount of funds
				const isFinancial = indType !== 'inkind';
				const financialField = moneyType === 'committed' ? 'totalCommitted' : 'totalSpent';
				const sortField = isFinancial ? financialField : 'totalInkind'; // TODO committed or disbursed IKS

				orgs = _.sortBy(orgs, d => d.curPayments[sortField]).reverse();
				// If IKS, filter out orgs that don't provide it
				if (!isFinancial) {
						orgs = orgs.filter(d => d.curPayments[sortField] > 0);
				}
				const colorScale = getColorScale();

				// populate the list with spans representing each entity
				if (orgs.length > 0) {
						$list.selectAll('.list-item')
								.data(orgs).enter().append('div')
								.attr('class', 'list-item')
								.text(d => d.donor_name)
								// .style('color',function(d) { return colorScale(d.curPayments[sortField])})
								.on('click', function onClick(d) {
										const curListItem = d3.select(this);
										if (curListItem.classed('active')) {
												d3.selectAll('.list-item').classed('active', false);
												return resetMap();
										} else if ($('.list-item.active').length === 0) {
												map.reset();
										}

										d3.selectAll('.list-item').classed('active', false);
										curListItem.classed('active', true);

										activeCountry = {
												datum: () => {
														return {
																listItemData: d,
																flow: moneyFlow,
																properties: App.nonCountries.find(dd => d.donor_code === dd.FIPS),
														};
												},
										};

										// display info box
										displayCountryInfo();
										return true;
								})
								.style('fill', function (d) {
										checkHatchStatus(d, d3.select(this), colorScale);
										return 'green;';
								})
								.insert('div')
								.attr('class', 'circle-container right')
								.append('svg')
								.attr('width', '12')
								.attr('height', '12')
								.append('circle')
								.attr('r', 6)
								.attr('cx', 6)
								.attr('cy', 6)
								.style('fill', d => {
										if (d.curPayments[sortField] === 0) return 'rgb(204, 204, 204)';
										return colorScale(d.curPayments[sortField]);
								})
								.each(function () {
										setDotPosition(this);
								});
						// .insert('br');
				} else {
						$list.append('div')
								.attr('class', 'list-item no-data')
								.text(`No ${moneyFlow === 'funded' ? 'funders' : 'recipients'} to show. Change options in bottom right to view data.`);
				}
				if (indType === 'score' || indType === 'combo') {
						$('.non-country-list-container').css('opacity', 0);
				} else {
						$('.non-country-list-container').css('opacity', 1);
				}
		};

		/**
		 * Scrolls the list div to the item indicated in the argument (animated).
		 * @param  {D3 selection} $item         The list item D3 selection to be scrolled to
		 */
		function scrollToListItem($item) {
				// get current list

				$item = $($item.node());
				const $list = $item.parent('.non-country-list');
				$list.scrollTop(0);

				// get original list top
				const origListTop = $list.scrollTop();

				// get list top if at scrollTop(0)
				$list.scrollTop(0);
				const baselineListTop = $list.position().top;

				// go back to original list top
				$list.scrollTop(origListTop);

				// get target top
				const itemTop = $item.position().top;

				// get difference between target top and list top at scrollTop(0)
				const diff = itemTop - $list.scrollTop();

				// add this to current scrollTop and scroll to it
				const scrollTopTarget = $list.scrollTop() + diff;
				$list.scrollTop(scrollTopTarget);
		};

		function initTableSearch() {
				App.initCountrySearchBar('.org-search-container', (result) => {
						if (result.item !== undefined) result = result.item;
						hasher.setHash(`analysis/${result.ISO2}/d`);
				}, {
						width: 400,
						includeNonCountries: true,
				});
		}

		function populateTables(donorSelector, recSelector) {
				const numRows = Infinity;
				const fundColor = greens;
				const receiveColor = purples;

				$(`${donorSelector}, ${recSelector}`).DataTable().destroy();
				$(`${donorSelector} tbody tr, ${recSelector} tbody tr`).remove();

				let spentFilter = {};
				const ccs = $('.org-cc-select').val();

				if (ccs.length <= App.capacities.length) {
						spentFilter.ccs = ccs;
				}

				if (startYear > App.dataStartYear) {
						spentFilter.startYear = startYear;
				}

				if (endYear < App.dataEndYear) {
						spentFilter.endYear = endYear;
				}

				let committedFilter = _.clone(spentFilter);

				committedFilter.committedOnly = true;

				// get top funded countries
				const fundedFunc = (supportType === 'financial') ? App.getTotalFunded : App.getInkindFunded;
				const formatFunc = (supportType === 'financial') ? App.formatMoney : App.formatInkind;
				const receivedFunc = (supportType === 'financial') ? App.getTotalReceived : App.getInkindReceived;
				const funderNoun = (supportType === 'financial') ? 'Funder' : 'Provider';
				let dNoun = (orgMoneyType === 'org-committed') ? 'Committed' : 'Disbursed';
				dNoun += (supportType === 'financial') ? ' (financial support)' : ' (in-kind support)';
				$('.fund-table-title .text').text(`Top ${funderNoun.toLowerCase()}s (${startYear} - ${endYear})`);
				$('.rec-table-title .text').text(`Top recipients (${startYear} - ${endYear})`);
				$('.fund-col-name.head-text').text(funderNoun);
				$('.d-col-name').text(dNoun);

				const countriesByFunding = [];
				for (const iso in App.fundingLookup) {
						if (iso !== 'Not reported' && iso !== 'ghsa' && iso !== 'General Global Benefit') {
								const newObj = {
										iso,
										name: App.codeToNameMap.get(iso),
										total_committed: fundedFunc(iso, committedFilter),
										total_spent: fundedFunc(iso, spentFilter),
								};
								if (newObj.total_committed !== 0 || newObj.total_spent !== 0) {
										countriesByFunding.push(newObj);
								}
						}
				}
				Util.sortByKey(countriesByFunding, 'total_spent', true);

				// get top recipient countries
				const countriesByReceived = [];
				for (const iso in App.recipientLookup) {
						if (iso !== 'Not reported' && iso !== 'ghsa' && iso !== 'General Global Benefit') {
								const newObj = {
										iso,
										name: App.codeToNameMap.get(iso),
										total_committed: receivedFunc(iso, committedFilter),
										total_spent: receivedFunc(iso, spentFilter),
								};
								if (newObj.total_committed !== 0 || newObj.total_spent !== 0) {
										countriesByReceived.push(newObj);
								}
						}
				}
				Util.sortByKey(countriesByReceived, 'total_spent', true);

				/**
				 * Initializes / Updates tooltips for Explore/Org tables.
				 * @param  {object} $tooltipTarget jQuery selection of tooltip target
				 * @param  {object} entity         Data about the table row entity
				 * @param  {object} entityType     Params defining table type
				 */
				const initTooltips = ($tooltipTarget, entity, entityType) => {

					/**
					* Returns the context for the table tooltip HB template.
					* @param  {object} entity     Data about table row entity
					* @return {object}            Context for HB template
					*/
					const getTableTooltipContext = (entity) => {
						const getIndTypeForTooltip = (indType) => {
							switch (indType) {
								case 'org-money':
								case 'money':
								case 'org-inkind':
								case 'inkind':
									return 'money-inkind';
									break;
								case 'org-score':
									return 'jee-score';
									break;
								default:
									console.log('Unexpected indicator type: ' + indType);
									return 'money-inkind';
								break;
							}
							console.log('Unexpected indicator type: ' + indType);
							return '';
						};
						const format = getValueFormat (
							indType, // from the radio toggle
							{
								bigTooltip: true, // special formatting and language
							}
						);
						const isGhsa = false;
						const context = {
							mode: getIndTypeForTooltip(indType),
							totalCommittedFmt: format(entity.total_committed),
							totalSpentFmt: format(entity.total_spent),
							committedLabel: getMoneyTypeLabel('funded', 'committed', isGhsa),
							spentLabel: getMoneyTypeLabel('funded', 'disbursed', isGhsa),
							headerColor: entityType.color,
							...entity,
						};
						// for (field in entity) { context[field] = entity[field]; }
						return context;
					};
					const context = getTableTooltipContext(entity);
					$tooltipTarget.tooltipster({
						trigger: 'hover',
						minWidth: 300,
						maxWidth: 350,
						interactive: true,
						functionAfter: (helper, instance) => { $(instance.origin).removeClass('active'); },
						functionReady: (helper, instance) => {
							const theme = App.currentTheme === 'dark' ? 'light' : 'dark';
							App.toggleTheme(theme);
							$(instance.origin).addClass('active');
							$('.tooltipster-fr-table .info-analysis-button').on('click', function onClick () {
								if (entity.iso !== 'Not reported') {
									hasher.setHash(`analysis/${entity.iso}/${entityType.code}`);
								}
							})
						},
						theme: ['tooltipster-shadow', 'tooltipster-talus', 'tooltipster-sidetip', 'tooltipster-fr-table'],
						content: Routing.tooltipTemplates['tooltip-fr'](context),
					});
				}

				// populate funding table
				const dRows = d3.select(donorSelector).select('tbody').selectAll('tr')
						.data(countriesByFunding.slice(0, numRows))
						.enter().append('tr')
						// .style('background-color', '#eaeaea')
						.style('background', 'transparent')
						// .style('background-color', (d, i) => fundColor[Math.floor(i / 2)])
						// .style('color', 'black')
						// .style('color', (d, i) => (i < 4 ? '#fff' : 'black'))
						// .on('click', (d) => {
						// 		if (d.iso !== 'Not reported') {
						// 				hasher.setHash(`analysis/${d.iso}/d`);
						// 		}
						// })
						.each(function (entity) {
							initTooltips(
								$(this), // tooltip target
								entity, // tooltip initial data
								{
									code: 'd',
									name: 'funded',
									color: fundingColor,
								} // tooltip parameters
							);
						}
					);
				dRows.append('td').html((d) => {
						const country = App.countries.find(c => c.ISO2 === d.iso);
						const flagHtml = country ? App.getFlagHtml(d.iso) : '';
						const name = App.codeToNameMap.get(d.iso);
						return name;
						return `<div class="flag-container">${flagHtml}</div>` +
								`<div class="name-container">${name}</div>`;
				});
				// dRows.append('td').text(d => formatFunc(d.total_committed));
				dRows.append('td').text(d => formatFunc((orgMoneyType === 'org-committed') ? d.total_committed : d.total_spent));

				// populate recipient table
				const rRows = d3.select(recSelector).select('tbody').selectAll('tr')
						.data(countriesByReceived.slice(0, numRows))
						.enter().append('tr')
						// .style('background-color', '#eaeaea')
						.style('background', 'transparent')
						// .style('color', 'black')
						// .on('click', (d) => {
						// 		if (d.iso !== 'Not reported') {
						// 				hasher.setHash(`analysis/${d.iso}/r`);
						// 		}
						// })
						.each(function (entity) {
							initTooltips(
								$(this), // tooltip target
								entity, // tooltip initial data
								{
									code: 'r',
									name: 'received',
									color: recipientColor,
								} // tooltip parameters
							);
						}
					);
				rRows.append('td').html((d) => {
						const country = App.countries.find(c => c.ISO2 === d.iso);
						const flagHtml = country ? App.getFlagHtml(d.iso) : '';
						const name = country ? country.NAME : d.iso;
						return name;
						return `<div class="flag-container">${flagHtml}</div>` +
								`<div class="name-container">${name}</div>`;
				});
				// rRows.append('td').text(d => formatFunc(d.total_committed));
				rRows.append('td').text(d => formatFunc((orgMoneyType === 'org-committed') ? d.total_committed : d.total_spent));

				$(`${donorSelector}, ${recSelector}`).DataTable({
						pageLength: 10,
						scrollCollapse: false,
						autoWidth: false,
						ordering: false,
						searching: false,
						pagingType: 'simple',
						// order: [[1, 'asc']],
						// columnDefs: [
						// 	{ targets: [1,2,3], orderable: false},
						// ],
						columns: [
								{ width: '80%' },
								{ width: '20%' },
						],
						bLengthChange: false,
						drawCallback: () => {
								switch (App.currentTheme) {
										case 'dark':
												$('#theme-toggle').bootstrapToggle('on');
												break;
										default:
												$('#theme-toggle').bootstrapToggle('off');
												break;
								}
						},
				});
		}

})();
