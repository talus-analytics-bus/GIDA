(() => {
		App.initAnalysis = (tab) => {
				let currentTab = tab;
				let startYear = App.dataStartYear;
				let endYear = App.dataEndYear + 1;
				let networkMap;
				let activeCountry;

				function init() {
						App.setSources();
						initTabs();
						updateTab();

						populateFilters();
						initSlider();
						initNetworkSearch();
						initNetworkCountryBox();
						networkMap = buildNetworkMap();
						$('.submit-data-btn').click(() => hasher.setHash('submit'));
						initTableSearch();
						populateTables('.donor-table', '.recipient-table');
						initGhsaToggle(tab);
				}

				function initGhsaToggle(tab = 'network') {
						// set GHSA radio button to checked if that is set
						if (App.showGhsaOnly) {
								$(`input[type=radio][name="ind-${tab === 'network' ? tab : 'country-global'}"][ind="ghsa"]`).prop('checked', true);
						}

						if (tab === 'country') {
								$('.global-tab-content[tab="country"] .ind-type-filter .radio-option').click(function updateIndType() {
										// Load correct funding data
										indType = $(this).find('input').attr('ind');
										App.showGhsaOnly = indType === 'ghsa';
										App.loadFundingData({ showGhsaOnly: App.showGhsaOnly });

										// Clear tables
										const donorSelector = '.donor-table';
										const recSelector = '.recipient-table';
										$(`${donorSelector} tbody, ${recSelector} tbody`).html('');

										// check right radio
										$(this).find('input').prop('checked', true);

										// Repopulate tables with chosen data
										populateTables(donorSelector, recSelector);
								});
						} else if (tab === 'network') {
								$('.global-tab-content[tab="network"] .ind-type-filter .radio-option').click(function updateIndType() {
										// Load correct funding data
										indType = $(this).find('input').attr('ind');
										App.showGhsaOnly = indType === 'ghsa';
										App.loadFundingData({ showGhsaOnly: App.showGhsaOnly });

										// Update chord diagram (network map)
										updateNetworkMap();
								});
						}

						// init tooltip
						$('.ghsa-info-img').tooltipster({
								interactive: true,
								content: App.ghsaInfoTooltipContent,
						});
				}

				function initTabs() {
						// define info table tab behavior
						$('.analysis-global-tab-container .btn').on('click', function changeTab() {
								currentTab = $(this).attr('tab');
								if (currentTab === 'network') {
										hasher.setHash('analysis');
								} else {
										hasher.setHash(`analysis/${currentTab}`);
								}
						});
				}

				function updateTab() {
						// make correct tab active
						$(`.analysis-global-tab-container .btn[tab="${currentTab}"]`)
								.addClass('active')
								.siblings().removeClass('active');
						$(`.global-tab-content-container .tab-content[tab="${currentTab}"]`)
								.slideDown()
								.siblings().slideUp();
				}

				// populates the filters in the map options box
				function populateFilters() {
						// populate dropdowns
						App.populateCcDropdown('.cc-select');
						$('.cc-select').on('change', updateNetworkMap);

						// set GHSA radio button to checked if that is set
						if (App.showGhsaOnly) {
								$('input[type=radio][name="ind"][ind="ghsa"]').prop('checked', true);
						}

						// initialize radio button functionality
						$('.network-map-options .radio-option').click(function clickedRadio() {
								const $option = $(this);
								$option.find('input').prop('checked', true);
								$option.siblings().find('input').prop('checked', false);
								updateNetworkMap();
						});

						// add info tooltips
						$('.committed-info-img').tooltipster({
								content: 'The <b>amount committed</b> refers to the amount of money committed.',
						});
						$('.disbursed-info-img').tooltipster({
								content: 'The <b>amount disbursed</b> refers to the amount of money the ' +
										'recipient country has received.',
						});
				}

				// initializes slider functionality
				function initSlider() {
						const slider = App.initSlider('.time-slider', {
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
										updateNetworkMap();
								}
						});
						return slider;
				}

				// initializes search functionality
				function initNetworkSearch() {
						App.initCountrySearchBar('.network-country-search', (result) => {
								displayCountryInNetwork(result.ISO2);
						}, {
								includeNonCountries: true,
						});
				}

				function initTableSearch() {
						App.initCountrySearchBar('.table-country-search', (result) => {
								if (result.item !== undefined) result = result.item;
								hasher.setHash(`analysis/${result.ISO2}`);
						}, {
								width: 400,
								includeNonCountries: true,
						});
				}

				/**
				 * Returns true if project is not in-kind support, false otherwise
				 * @param  {Object} p             A project
				 * @return {Boolean} true if p is not in-kind, false otherwise
				 */
				function excludeInkindFilter(p) {
						if (p.assistance_type.toLowerCase() === 'in-kind support') return false;
						return true;
				};

				function updateTables() {
						populateTables('.donor-table', '.recipient-table');
				}

				function populateTables(donorSelector, recSelector) {
						const numRows = 10;
						const fundColor = App.fundColorPalette;
						const receiveColor = App.receiveColorPalette;

						$(`${donorSelector}, ${recSelector}`).DataTable().destroy();
						$(`${donorSelector} tbody tr, ${recSelector} tbody tr`).remove();

						let spentFilter = {};
						const ccs = $('.cc-select').val();

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
						const countriesByFunding = [];
						for (const iso in App.fundingLookup) {
								if (iso !== 'Not reported' && iso !== 'ghsa') {
										const newObj = {
												iso,
												name: App.codeToNameMap.get(iso),
												total_committed: App.getTotalFunded(iso, committedFilter),
												total_spent: App.getTotalFunded(iso, spentFilter),
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
								if (iso !== 'Not reported' && iso !== 'ghsa') {
										const newObj = {
												iso,
												name: App.codeToNameMap.get(iso),
												total_committed: App.getTotalReceived(iso, committedFilter),
												total_spent: App.getTotalReceived(iso, spentFilter),
										};
										if (newObj.total_committed !== 0 || newObj.total_spent !== 0) {
												countriesByReceived.push(newObj);
										}
								}
						}
						Util.sortByKey(countriesByReceived, 'total_spent', true);

						// populate funding table
						const dRows = d3.select(donorSelector).select('tbody').selectAll('tr')
								.data(countriesByFunding.slice(0, numRows))
								.enter().append('tr')
								.style('background-color', (d, i) => fundColor[Math.floor(i / 2)])
								.style('color', (d, i) => (i < 4 ? '#fff' : 'black'))
								.on('click', (d) => {
										if (d.iso !== 'Not reported') {
												hasher.setHash(`analysis/${d.iso}/d`);
										}
								});
						dRows.append('td').html((d) => {
								const country = App.countries.find(c => c.ISO2 === d.iso);
								const flagHtml = country ? App.getFlagHtml(d.iso) : '';
								const name = App.codeToNameMap.get(d.iso);

								return `<div class="flag-container">${flagHtml}</div>` +
										`<div class="name-container">${name}</div>`;
						});
						dRows.append('td').text(d => App.formatMoney(d.total_committed));
						dRows.append('td').text(d => App.formatMoney(d.total_spent));

						// populate recipient table
						const rRows = d3.select(recSelector).select('tbody').selectAll('tr')
								.data(countriesByReceived.slice(0, numRows))
								.enter().append('tr')
								.style('background-color', (d, i) => receiveColor[Math.floor(i / 2)])
								.style('color', (d, i) => (i < 4 ? '#fff' : 'black'))
								.on('click', (d) => {
										if (d.iso !== 'Not reported') {
												hasher.setHash(`analysis/${d.iso}/r`);
										}
								});
						rRows.append('td').html((d) => {
								const country = App.countries.find(c => c.ISO2 === d.iso);
								const flagHtml = country ? App.getFlagHtml(d.iso) : '';
								const name = country ? country.NAME : d.iso;
								return `<div class="flag-container">${flagHtml}</div>` +
										`<div class="name-container">${name}</div>`;
						});
						rRows.append('td').text(d => App.formatMoney(d.total_committed));
						rRows.append('td').text(d => App.formatMoney(d.total_spent));
				}

				function tagDivisors(projects) {
						const projectsById = _.groupBy(projects, 'project_id');
						_.mapObject(projectsById, (val, key) => {
								const divisor = val.length;
								val.forEach(p => p.divisor = divisor);
						});
				}

				function getTotalFunc() {
						const ccs = $('.cc-select').val();
						const ind = $('.money-type-filter input:checked').attr('ind');
						const indName = (ind === 'committed') ? 'committed_by_year' : 'spent_by_year';
						return (p) => {
								// for network map, no "Not reported" recipients
								// if (p.recipient_country === 'Not reported') return 0;

								// run through filter first
								if (!App.passesCategoryFilter(p.core_capacities, ccs)) return 0;

								// get total for years
								let total = 0;
								for (let i = startYear; i < endYear; i++) {
										total += p[indName][i];
								}
								return total;
						};
				}

				function getNetworkData() {
						// Get total funded and total received for each entity in App.countries except those that will be excluded
						// which are:
						// GGB
						// GHSA
						// All regions, countries, governments
						// const excludedSectors = ['Region'];
						App.codeToNameMap.set('Not reported', 'Not reported');
						const allowedEntities = App.codes;
						// const allowedEntities = App.codes.filter(d => d.donor_sector !== 'Region');
						const entities = App.countries.filter(d => {
								if (d.country !== false) return true;
								if (allowedEntities.find(allowedEntity => d.ISO2 === allowedEntity.donor_code)) {
										return true;
								} else {
										return false;
								}
						}).filter(d => d.FIPS !== '');

						entities.push({
								'FIPS': 'Not reported',
								'ISO2': 'Not reported',
								'NAME': 'Not reported',
								'regionName': 'Other Funders / Recipients',
								'subRegionName': 'Other Funders / Recipients',
								'intermediateRegionName': 'Other Funders / Recipients',
								'country': false,
						});


						allowedEntities.push({
								donor_code: 'Not reported',
								donor_name: 'Not reported',
						});

						// For each allowed entity, calculate totalFunded and totalReceived, financials only
						// {
						//   "name": "Tunisia",
						//   "iso": "TN",
						//   "totalFunded": 3,
						//   "totalReceived": 25816408.19752373,
						//   "totalFlow": 25816411.19752373,
						//   "funds": [
						//     {
						//       "donor": "TN",
						//       "recipient": "undefined",
						//       "value": 3
						//     }
						//   ]
						// }

						const entityData = {};
						const getTotalForProject = getTotalFunc();
						// const allowedFunds = App.fundingData.filter(d => d.assistance_type.includes('financial'));
						const allowedFunds = App.fundingData.filter(d => d.assistance_type.includes('financial'));
						tagDivisors(allowedFunds);
						// const allowedFunds = Util.uniqueCollection(App.fundingData.filter(d => d.assistance_type.includes('financial')), 'project_id');
						const fundsByProvider = _.groupBy(allowedFunds, 'donor_code');
						const allowedEntityIsos = _.pluck(entities, 'ISO2');
						entities.forEach(entity => {
								const name = entity.NAME;
								const iso = entity.ISO2;
								const region = entity.regionName;
								const subregion = entity.subRegionName;

								// get all funds provided by this entity
								let rawFunds = fundsByProvider[iso] || [];

								// get unique ones only
								// Already done above

								// filter out anything provided to an entity not in 'entities'
								rawFunds = rawFunds.filter(p => {
										return allowedEntityIsos.indexOf(p.recipient_country) > -1;
								});

								// filter out anything that is undetermined: provided to multi recipients for example
								// const includeUnexactAmounts = false;
								const includeUnexactAmounts = true;
								if (!includeUnexactAmounts) {
										rawFunds = rawFunds.filter(p => {
												const amountNotExact = p.donor_amount_unspec === true || p.recipient_amount_unspec === true;
												return !amountNotExact;
										});
								}

								// filter out anything that has a zero amount but is financial
								// const excludeZeroAmounts = true;
								const excludeZeroAmounts = false;
								const amountShift = excludeZeroAmounts ? 0 : 0;
								// const amountShift = excludeZeroAmounts ? 0 : 10000000;
								if (excludeZeroAmounts) {
										rawFunds = rawFunds.filter(p => {
												return getTotalForProject(p) > 0;
										});
								} else {
										rawFunds.forEach(p => {
												if (getTotalForProject(p) === 0) {
														p.doFakeIncrement = true;
												}
										});
								}

								// group by recipient ISOs (recipient_country)
								const rawFundsByRecipientIso = _.groupBy(rawFunds, 'recipient_country');


								const noFundsToAdd = Object.keys(rawFundsByRecipientIso).length === 0;
								if (noFundsToAdd) {
										entityData[iso] = {
												iso: iso,
												name: name,
												region: region,
												subregion: subregion,
												totalFunded: 0.0,
												funds: [],
										};
								} else {
										// calculate total for each recipient and push to funds array
										const funds = [];
										let totalFunded = 0.0;
										const totalsByRecipientIso = _.mapObject(rawFundsByRecipientIso, (recipientFunds, recipientIso) => {
												let value = 0.0;
												recipientFunds.forEach(p => {
														if (p.divisor) {
																value = value + ((getTotalForProject(p) / p.divisor) || amountShift);
														} else {
																value = value + ((getTotalForProject(p)) || amountShift);
														}
												});
												totalFunded = totalFunded + value;
												funds.push({
														value: value,
														donor: iso,
														recipient: recipientIso,
												});
										});
										entityData[iso] = {
												iso: iso,
												name: name,
												region: region,
												subregion: subregion,
												totalFunded: totalFunded,
												funds: funds,
										};
								}
						});

						// PART 2: Calculate totalReceived, and remove any with a totalFlow of zero.
						_.mapObject(entityData, (recipientDatum, recipientIso) => {
								let totalReceived = 0.0;
								allowedEntityIsos.forEach(funderIso => {
										const funderDatum = entityData[funderIso];
										if (!funderDatum) return;
										const recipientFunds = funderDatum.funds.find(fund => fund.recipient === recipientIso);
										if (recipientFunds) {
												totalReceived = totalReceived + recipientFunds.value;
										}
								});
								recipientDatum.totalReceived = totalReceived;
								recipientDatum.totalFlow = recipientDatum.totalReceived + recipientDatum.totalFunded;
						});

						_.mapObject(entityData, (entityDatum, entityIso) => {
								if (entityDatum.totalFlow === 0) delete entityData[entityIso];
						});

						// PART 3: Map to chord arc structure.
						// Get region totals
						const fundsByRegion = _.groupBy(_.values(entityData), 'region');

						const chordData = _.mapObject(fundsByRegion, (regionFunds, region) => {
								// First: get totalFunded, totalReceived, and totalFlow by subregion
								const fundsBySubregion = _.groupBy(regionFunds, 'subregion');
								const regionChildren = _.mapObject(fundsBySubregion, (subregionFunds, subregion) => {
										const regionChild = {
												name: subregion,
												children: subregionFunds,
												totalFunded: d3.sum(_.values(subregionFunds), d => d.totalFunded),
												totalReceived: d3.sum(_.values(subregionFunds), d => d.totalReceived),
										};
										regionChild.totalFlow = regionChild.totalFunded + regionChild.totalReceived;
										return regionChild;
								});
								const regionDatum = {
										name: region,
										children: _.values(regionChildren),
										totalFunded: d3.sum(_.values(regionFunds), d => d.totalFunded),
										totalReceived: d3.sum(_.values(regionFunds), d => d.totalReceived),
								};
								regionDatum.totalFlow = regionDatum.totalFunded + regionDatum.totalReceived;
								return regionDatum;
						});

						return _.values(chordData);
				}

				// App.getNetworkData2();

				function getNetworkDataOld() {
						// get data function
						const totalFunc = getTotalFunc();

						// separate the data by region, subregion, country
						const networkData = [];
						const fundsByRegion = {};

						// add each country with non-zero donated or received funds
						for (let i = 0; i < App.countries.length; i++) {
								const c = App.countries[i];
								const iso = c.ISO2;

								// remove general global benefit

								const fundedPaymentsTmp = Util.uniqueCollection(App.fundingLookup[iso], 'project_id');
								const receivedPayments = Util.uniqueCollection(App.recipientLookup[iso], 'project_id');


								const fundedPayments = (fundedPaymentsTmp) ? fundedPaymentsTmp : undefined;
								// construct chord data; sort by region and subregion
								let totalFunded = 0;
								let totalReceived = 0;
								if (fundedPayments) totalFunded = d3.sum(fundedPayments, d => totalFunc(d));
								if (receivedPayments) totalReceived = d3.sum(receivedPayments, d => totalFunc(d));
								if (totalFunded || totalReceived) {

										const region = c.regionName;
										const sub = c.subRegionName;
										if (!fundsByRegion[region]) fundsByRegion[region] = {};
										if (!fundsByRegion[region][sub]) fundsByRegion[region][sub] = {};
										if (!fundsByRegion[region][sub][iso]) {
												fundsByRegion[region][sub][iso] = {
														totalFunded,
														totalReceived,
														fundsByC: {},
												};
										}

										if (fundedPayments) {
												fundedPayments.forEach((p) => {
														const value = totalFunc(p);
														if (value) {
																const rIso = p.recipient_country;
																if (!fundsByRegion[region][sub][iso].fundsByC[rIso]) {
																		fundsByRegion[region][sub][iso].fundsByC[rIso] = 0;
																}
																fundsByRegion[region][sub][iso].fundsByC[rIso] += value;
														}
												});
										}
								}
						}

						// // add non-countries funders
						// let otherFunders = false;
						// fundsByRegion['Other Funders'] = { 'Other Funders': {} };
						// for (const iso in App.fundingLookup) {
						// 	if (!App.countries.find(c => c.ISO2 === iso)) {
						// 		fundsByRegion['Other Funders']['Other Funders'][iso] = {
						// 			totalFunded: d3.sum(App.fundingLookup[iso], d => totalFunc(d)),
						// 			totalReceived: 0,
						// 			fundsByC: {},
						// 		};
						// 		App.fundingLookup[iso].forEach((p) => {
						// 			const value = totalFunc(p);
						// 			if (value) {
						// 				otherFunders = true;
						// 				const rIso = p.recipient_country;
						// 				if (!fundsByRegion['Other Funders']['Other Funders'][iso].fundsByC[rIso]) {
						// 					fundsByRegion['Other Funders']['Other Funders'][iso].fundsByC[rIso] = 0;
						// 				}
						// 				fundsByRegion['Other Funders']['Other Funders'][iso].fundsByC[rIso] += value;
						// 			}
						// 		});
						// 	}
						// }

						// if (!otherFunders) delete fundsByRegion['Other Funders'];

						// // add non-countries
						// fundsByRegion['Other Recipients'] = { 'Other Recipients': {} };
						// for (const iso in App.recipientLookup) {
						// 	if (App.countries.find(c => c.ISO2 === iso && c.country === false)) {
						// 		fundsByRegion['Other Recipients']['Other Recipients'][iso] = {
						// 			totalReceived: d3.sum(App.recipientLookup[iso], d => totalFunc(d)),
						// 			totalFunded: 0,
						// 			fundsByC: {},
						// 		};
						// 		// App.recipientLookup[iso].forEach((p) => {
						// 		// 	const value = totalFunc(p);
						// 		// 	if (value) {
						// 		// 		const rIso = p.recipient_country;
						// 		// 		if (!fundsByRegion['Other Recipients']['Other Recipients'][iso].fundsByC[rIso]) {
						// 		// 			fundsByRegion['Other Recipients']['Other Recipients'][iso].fundsByC[rIso] = 0;
						// 		// 		}
						// 		// 		fundsByRegion['Other Recipients']['Other Recipients'][iso].fundsByC[rIso] += value;
						// 		// 	}
						// 		// });
						// 	}
						// }

						// // add non-countries
						// fundsByRegion['Other Funders / Recipients'] = { 'Other Funders / Recipients': {} };
						// for (const iso in App.recipientLookup) {
						// 	if (App.countries.find(c => c.ISO2 === iso && c.country === false)) {
						// 		fundsByRegion['Other Funders / Recipients']['Other Funders / Recipients'][iso] = {
						// 			totalReceived: d3.sum(App.recipientLookup[iso], d => totalFunc(d)),
						// 			totalFunded: 0,
						// 			fundsByC: {},
						// 		};
						// 		App.recipientLookup[iso].forEach((p) => {
						// 			const value = totalFunc(p);
						// 			if (value) {
						// 				const rIso = p.recipient_country;
						// 				if (!fundsByRegion['Other Funders / Recipients']['Other Funders / Recipients'][iso].fundsByC[rIso]) {
						// 					fundsByRegion['Other Funders / Recipients']['Other Funders / Recipients'][iso].fundsByC[rIso] = 0;
						// 				}
						// 				fundsByRegion['Other Funders / Recipients']['Other Funders / Recipients'][iso].fundsByC[rIso] += value;
						// 			}
						// 		});
						// 	}
						// }

						// build chord chart data
						for (const r in fundsByRegion) {
								const region = {
										name: r,
										children: [],
										totalFunded: 0,
										totalReceived: 0,
										totalFlow: 0,
								};
								for (const sub in fundsByRegion[r]) {
										const subregion = {
												name: sub,
												children: [],
												totalFunded: 0,
												totalReceived: 0,
												totalFlow: 0,
										};
										for (const iso in fundsByRegion[r][sub]) {
												const funds = [];
												for (const rIso in fundsByRegion[r][sub][iso].fundsByC) {
														funds.push({
																donor: iso,
																recipient: rIso,
																value: fundsByRegion[r][sub][iso].fundsByC[rIso],
														});
												}
												const totalFunded = fundsByRegion[r][sub][iso].totalFunded;
												const totalReceived = fundsByRegion[r][sub][iso].totalReceived;
												subregion.children.push({
														name: App.codeToNameMap.get(iso),
														iso,
														totalFunded,
														totalReceived,
														totalFlow: totalFunded + totalReceived,
														funds,
												});
												subregion.totalFunded += totalFunded;
												subregion.totalReceived += totalReceived;
												subregion.totalFlow += totalFunded + totalReceived;
										}
										region.children.push(subregion);
										region.totalFunded += subregion.totalFunded;
										region.totalReceived += subregion.totalReceived;
										region.totalFlow += subregion.totalFlow;
								}
								networkData.push(region);
						}
						return networkData;
				}

				function toggleNetworkContent(networkData) {
						// const noContentMessage = App.showGhsaOnly ? 'Not enough GHSA funding data to show network.' : 'There are no data with the combination of filters chosen.';
						// $('.network-map-no-content > span.text').text(noContentMessage);
						if (!networkData.length) {
								// if (!networkData.length || App.showGhsaOnly === true) {
								$('.network-map-content').hide();
								$('.network-map-no-content').show();
						} else {
								$('.network-map-content').show();
								$('.network-map-no-content').hide();
						}
				}

				function buildNetworkMap() {
						const networkData = getNetworkData();

						const chart = App.buildNetworkMap('.network-map-content', networkData, {
								countryClickFn: displayCountryInNetwork,
								regionPadding: 1,
						});
						chart.select('.overlay').on('click', unselectNetworkCountry);
						toggleNetworkContent(networkData);
						return chart;
				}

				function updateNetworkMap() {
						updateTables();
						const moneyType = $('.money-type-filter input:checked').attr('ind');
						const networkData = getNetworkData();
						toggleNetworkContent(networkData);
						networkMap.update(networkData, moneyType);
						if ($('.network-country-info').is(':visible')) {
								displayCountryInNetwork(activeCountry);
						}
				}

				function initNetworkCountryBox() {
						$('.info-close-button').click(unselectNetworkCountry);
				}

				function unselectNetworkCountry() {
						unhighlightNetwork();

						// hide country info display
						$('.network-country-info').slideUp();
				}

				function unhighlightNetwork() {
						// unhighlight arcs and links
						d3.selectAll('.country-arc').classed('active', false);
						d3.selectAll('.link').classed('search-hidden', false);
				}

				function displayCountryInNetwork(countryIso) {
						unhighlightNetwork();

						const countryName = App.codeToNameMap.get(countryIso);

						// highlight arc and links
						const arc = d3.selectAll('.country-arc')
								.filter(c => c.iso === countryIso)
								.classed('active', true);
						d3.selectAll('.link')
								.filter(l => l.donor !== countryIso && l.recipient !== countryIso)
								.classed('search-hidden', true);

						// if not found, display warning message
						if (arc.empty()) {
								noty({
										text: `<b>There are no funding data for ${countryName} in this time range.`,
								});
								unhighlightNetwork();
								return;
						}

						// populate country info
						const data = arc.datum();
						activeCountry = countryIso;
						$('.nci-title').text(countryName);
						const moneyType = $('.money-type-filter input:checked').attr('ind');
						if (data.totalFunded) {
								$('.nci-donor-value').text(App.formatMoney(data.totalFunded));
								$('.nci-donor-section .nci-value-label').text(moneyType === 'committed' ? 'Total Funded Commitments' : 'Total Funded Disbursements');
								$('.nci-donor-section').slideDown();
						} else {
								$('.nci-donor-section').slideUp();
						}
						if (data.totalReceived) {
								$('.nci-recipient-value').text(App.formatMoney(data.totalReceived));
								$('.nci-recipient-section .nci-value-label').text(moneyType === 'committed' ? 'Total Received Commitments' : 'Total Received Disbursements');
								$('.nci-recipient-section').slideDown();
						} else {
								$('.nci-recipient-section').slideUp();
						}

						// clicking the "show more" button takes user to country page
						$('.nci-more-button').off('click').on('click', () => {
								hasher.setHash(`analysis/${data.iso}`);
						});

						// display country info
						$('.network-country-info').slideDown();
				}

				init();
		};
})();
