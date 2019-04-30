const App = {};

(() => {
		App.initialize = (callback) => {
				// initialize nav menu items
				$('.nav li').on('click', function (e) {
						e.stopPropagation();
						const menuOption = $(this);
						const page = menuOption.attr('page');

						if (page === 'search') {
								$('.nav-search-control').toggle();
								return;
						}

						if (page === 'map') {
								$('.explore-dropdown').siblings('.menu-dropdown').hide();
								$('.explore-dropdown').toggle();
								return;
						}

						if (page === 'about') {
								$('.about-dropdown').siblings('.menu-dropdown').hide();
								$('.about-dropdown').toggle();
								return;
						}

						const hashArr = hasher.getHash().split('?');
						if (hashArr.length > 1) {
								hasher.setHash(`#${page}?${hashArr[1]}`);
						} else {
								hasher.setHash(`#${page}`);
						}
				});

				App.currentTheme = 'light';
				App.toggleTheme = (to) => {
						const elementsToChange = [
								'html',
								'body',
								'table',
								'body div',
								'.info-img',
								'label',
								'.map-container',
								'.navbar',
								'.navbar a li',
								'#page-content',
								'.logo',
								'td,tr',
								'.paginate_button',
								'button',
								'path',
						];
						let classToAdd;
						switch (to) {
								case 'dark':
										classToAdd = 'light';
										break;
								case 'light':
										classToAdd = 'dark';
										break;
								default:
										if (App.currentTheme === 'light') {
												classToAdd = 'dark';
										} else {
												classToAdd = 'light';
										}
										break;
						}
						App.currentTheme = classToAdd;
						elementsToChange.forEach(e => {
								$(e).removeClass('light').removeClass('dark').addClass(classToAdd);
						});
				};

				// http://www.bootstraptoggle.com/
				$('#theme-toggle').change(function () {
						const val = $(this).prop('checked');
						if (val) {
								App.toggleTheme('light');
						} else {
								App.toggleTheme('dark');
						}
				});

				$('.explore-dropdown-map').click(() => {
						$('.explore-dropdown').toggle();
						hasher.setHash(`#map/countries`);
				});

				$('.explore-dropdown-org').click(() => {
						$('.explore-dropdown').toggle();
						hasher.setHash(`#map/org`);
				});

				$('.about-dropdown-item').click(function () {
					$('.about-dropdown').toggle();
					const subpage = $(this).attr('page');
					hasher.setHash(`#about/${subpage}`);
				});

				$('body').click(() => {
						$('.nav-search-control').hide();
						$('.menu-dropdown').hide();
				});

				// data definition variables
				App.dataStartYear = 2014;
				App.dataEndYear = 2018;

				// Settings
				App.showGhsaOnly = false;
				App.usingFirefox = navigator.userAgent.search('Firefox') > -1;

				// (purple, orange) color scheme
				/* App.fundColor = '#283375';
				App.receiveColor = '#aa4e2a';
				App.fundColorPalette = ['#283375', '#535c91', '#7e85ac', '#a9adc8', '#d4d6e3'];
				App.receiveColorPalette = ['#aa4e2a', '#bb7155', '#cc957f', '#ddb8aa', '#eedcd4'];*/

				// (purple, green) color scheme
				// App.receiveColor = '#762a83';
				// App.fundColor = '#1b7837';
				// App.receiveColorPalette = ['#40004b','#762a83','#9970ab','#c2a5cf','#e7d4e8', '#f7f7f7'];
				// App.fundColorPalette= ['#00441b', '#1b7837', '#5aae61', '#a6dba0', '#d9f0d3', '#f7f7f7'];
				App.receiveColor = '#440042';
				App.fundColor = '#384434';
				// App.receiveColorPalette = ['#40004b',
				// 		'#762a83',
				// 		'#7c3991',
				// 		'#c2a5cf',
				// 		'#b89eb7',
				// 		'#f7f7f7'].reverse();
				// App.fundColorPalette = ['#00441b',
				// 		'#1b7837',
				// 		'#5aae61',
				// 		'#a6dba0',
				// 		'#d9f0d3',
				// 		'#f7f7f7'].reverse();
				App.receiveColorPalette = ['#3c003a',
						'#6a1266',
						'#713286',
						'#75559d',
						'#757fb6',
						'#88aac3'].reverse();
				App.fundColorPalette = ['#045f32',
						'#217249',
						'#3d8662',
						'#569778',
						'#99c2ae',
						'#eaeff1'].reverse();

				// (blue, red) color scheme
				/* App.fundColor = '#053061';
				App.receiveColor = '#67001f';

				App.fundColorPalette = ['#053061', '#2166ac', '#4393c3', '#92c5de', '#d1e5f0'];
				App.receiveColorPalette = ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7'];*/
				/* App.jeeColors = ['#c91414', '#ede929', '#ede929', '#ede929',
				'#ede929', '#0b6422', '#0b6422', '#0b6422'];*/

				// App.jeeColors = ['#a91726', '#f9a510', '#017c47'];
				App.jeeColors = [
						'#a91726',
						'#f9a510',
						'#f9a510',
						'#f9a510',
						// '#ede929',
						'#017c47',
						'#017c47',
						'#017c47',
				];

				/* App.fundColorPalette = [
					'#053061',
					'#2166ac',
					'#4393c3',
					'#92c5de',
					'#d1e5f0',
				];
				App.receiveColorPalette = [
					'#67001f',
					'#b2182b',
					'#d6604d',
					'#f4a582',
					'#fddbc7',
				];
				App.jeeColors = [
					'#c91414',
					'#ede929',
					'#ede929',
					'#ede929',
					'#ede929',
					'#0b6422',
					'#0b6422',
					'#0b6422'];
		*/

				// define global variables used throughout
				App.geoData = null;  // geographic data of the world
				App.countries = [];  // an array of all countries and their properties
				App.codeToNameMap = d3.map();  // a lookup map of a donor_code to the country name
				App.scoresByCountry = {};  // a lookup object of a donor_code to the country scores

				// funding variables
				App.fundingData = [];  // an array of all funding data
				App.currencies = {};  // a lookup of all global currencies
				App.currencyIso = 'USD';  // the default currency
				App.fundingLookup = {};  // a lookup of money funded for each country
				App.recipientLookup = {};  // a lookup of money received for each country
				App.capacities = [{
						'id': 'P.1',
						'name': 'P.1 - National Legislation, Policy, and Financing',
						'idx': 0,
				}, { 'id': 'P.2', 'name': 'P.2 - IHR Coordination, Communicaton and Advocacy', 'idx': 1 }, {
						'id': 'P.3',
						'name': 'P.3 - Antimicrobial Resistance (AMR)',
						'idx': 2,
				}, { 'id': 'P.4', 'name': 'P.4 - Zoonotic Disease', 'idx': 3 }, {
						'id': 'P.5',
						'name': 'P.5 - Food Safety',
						'idx': 4,
				}, { 'id': 'P.6', 'name': 'P.6 - Biosafety and Biosecurity', 'idx': 5 }, {
						'id': 'P.7',
						'name': 'P.7 - Immunization',
						'idx': 6,
				}, { 'id': 'D.1', 'name': 'D.1 - National Laboratory System', 'idx': 7 }, {
						'id': 'D.2',
						'name': 'D.2 - Real Time Surveillance',
						'idx': 8,
				}, { 'id': 'D.3', 'name': 'D.3 - Reporting', 'idx': 9 }, {
						'id': 'D.4',
						'name': 'D.4 - Workforce Development',
						'idx': 10,
				}, { 'id': 'R.1', 'name': 'R.1 - Preparedness', 'idx': 11 }, {
						'id': 'R.2',
						'name': 'R.2 - Emergency Response Operations',
						'idx': 12,
				}, {
						'id': 'R.3',
						'name': 'R.3 - Linking Public Health and Security Authorities',
						'idx': 13,
				}, {
						'id': 'R.4',
						'name': 'R.4 - Medical Countermeasures and Personnel Deployment',
						'idx': 14,
				}, { 'id': 'R.5', 'name': 'R.5 - Risk Communication', 'idx': 15 }, {
						'id': 'PoE',
						'name': 'PoE - Point of Entry (PoE)',
						'idx': 16,
				}, { 'id': 'CE', 'name': 'CE - Chemical Events', 'idx': 17 }, {
						'id': 'RE',
						'name': 'RE - Radiation Emergencies',
						'idx': 18,
				}, { 'id': 'General IHR Implementation', 'name': 'General IHR Implementation', 'idx': 19 }];
				App.coreCapacitiesText = 'Core capacities were tagged based on names and descriptions of commitments and disbursements. A single commitment or disbursement may support more than one core capacity. Additional information on how core capacities were tagged can be found on the <a href="#glossary" onlick="function(){hasher.setHash(`#glossary`)}">data definitions</a> page.';
				App.generalIhrText = 'Funds or support for "General IHR Implementation" are not associated with any specific core capacities, but instead provide general support for capacity-building under the International Health Regulations (e.g., supporting JEE missions, overall capacity building).';
				App.inKindDefinition = 'In-kind support is the contribution of goods or services to a recipient. Examples of in-kind support include providing technical expertise or programming support, or  supporting GHSA action packages.';

				// front-load all the data
				NProgress.start();
				d3.queue()
						.defer(d3.json, 'data/world.json')
						.defer(d3.csv, 'data/unsd_data.csv')
						.defer(d3.csv, 'data/donor_codes_live.csv')
						// .defer(d3.json, 'data/donor_codes.json')
						.defer(d3.json, 'data/funding_data-032119-v2.json')
						.defer(d3.json, 'data/jee_score_data.json')
						.defer(d3.json, 'data/currencies.json')
						.defer(d3.json, 'data/submitted_data-032119-v5.json') // non-iati data
						// .defer(d3.json, 'data/submitted_data.json') // non-iati data, created 15 June 2018
						// .defer(d3.json, 'data/who-iati-v15.json') // WHO projects from funding data v15
						.defer(d3.tsv, 'data/geographic_groupings.tsv')
						.defer(d3.csv, 'data/resolve_scores.csv')
						.await((error, worldData, unsdData, donorCodeData, fundingData, jeeData, currencies, submittedData, geographicGroupings, resolveScoresData) => {
								if (error) throw error;

								/* -------- Populate global variables -------- */
								// save geo data; save list of countries in namespace
								App.geographicGroupings = geographicGroupings;
								App.geographicGroupCodes = _.unique(_.pluck(App.geographicGroupings, 'group_code'));
								App.geoData = worldData;
								App.codes = donorCodeData;
								App.resolve_Scores = resolveScoresData;

								App.countries = worldData.objects.countries.geometries
										.map(c => c.properties);

								// append Kosovo to countries data
								App.countries = App.countries.concat(
										{
												'FIPS': 'XK',
												'ISO2': 'XK',
												'NAME': 'Kosovo',
												'POP2005': 1706000,
												'regionName': 'Europe',
												'subRegionName': 'Southern Europe',
												'intermediateRegionName': '',
										},
								);

								// save region names to countries
								const regionMap = d3.map();
								unsdData.forEach((d) => {
										regionMap.set(d['ISO-alpha3 Code'], d);
								});
								App.countries.forEach((c) => {
										App.codeToNameMap.set(c.ISO2, c.NAME);
										if (c.ISO2 === 'XK' || c.country === false) return;
										const regionInfo = regionMap.get(c.ISO3);
										c.regionName = regionInfo['Region Name'];
										c.subRegionName = regionInfo['Sub-region Name'];
										c.intermediateRegionName = regionInfo['Intermediate Region Name'];
								});
								App.codeToNameMap.set('General Global Benefit', 'General Global Benefit');

								// fill code to name map
								donorCodeData.forEach((d) => {
										if (!App.codeToNameMap.has(d.donor_code)) {
												App.codeToNameMap.set(d.donor_code, d.donor_name);
										}
										App.addOtherRecipients(d);
								});

								// Append WHO IATI data from v15 and IATI data from v16
								// because WHO data are no longer accessible on D-Portal or IATI
								// fundingData = fundingData.concat(whoIatiData);

								fundingData = fundingData.concat(submittedData);

								// Set undefined assistance types to financial
								fundingData.forEach(d => {
									if (d.project_description === undefined) d.project_description = '';
									if (d.donor_name === undefined) d.donor_name = '';
										if (d.assistance_type === undefined || d.assistance_type === 'NA' || d.assistance_type.toLowerCase().includes("financial")) {
												d.assistance_type = 'Direct financial support';
										}

										// Get year range
										function getYearRange (datum) {
											const t = datum.transactions;
											if (t.length > 0) {
												const min = Math.min(...t.map(tt => {
													if (tt.cy === '') return Infinity;
													if (+tt.cy > +App.dataEndYear) {
														return Infinity;
													} else return +tt.cy;
												}
											)
										);
										const max = Math.max(...t.map(tt => {
											if (tt.cy === '') return -Infinity;
											if (+tt.cy > +App.dataEndYear) {
												return -Infinity;
											} else return +tt.cy;
										}
									)
								);
								if (isNaN(min) || isNaN(max)) return '';
								if (min === Infinity || max === -Infinity) return '';
								if (min === max) return min;
								else return `${min} - ${max}`;
							} else return '';
						}
										d.year_range = getYearRange(d).toString();
										d.core_capacities.forEach(cc => {
												if (cc === 'General GHSA assistance') {
														idx = d.core_capacities.indexOf(cc);
														d.core_capacities[idx] = 'General IHR Implementation';
												} else if (cc === 'O.1') {
														idx = d.core_capacities.indexOf(cc);
														d.core_capacities[idx] = 'PoE';

												} else if (cc === 'O.2') {
														idx = d.core_capacities.indexOf(cc);
														d.core_capacities[idx] = 'CE';

												} else if (cc === 'O.3') {
														idx = d.core_capacities.indexOf(cc);
														d.core_capacities[idx] = 'RE';
												}
										});
								});

								// hide unops data until we can fix it
								fundingData = fundingData.filter(d => d.donor_code !== '41aaa');

								// tag datum if no specific value reported
								App.tagProjectsWithNoValuesReported(fundingData);

								App.fundingData = fundingData;
								App.fundingDataFull = fundingData.map(d => $.extend(true, {}, d));

								// Prepare funding lookup tables, etc.
								App.loadFundingData({ showGhsaOnly: false });

								// save indicator scores by country
								jeeData.forEach((sRow) => {
										const indId = sRow.indicator.split(' ')[0];
										let capId = indId.split('.').slice(0, 2).join('.');

										if (capId.split('.')[0] === 'PoE') {
												capId = 'PoE';
										} else if (capId.split('.')[0] === 'RE') {
												capId = 'RE';
										} else if (capId.split('.')[0] === 'CE') {
												capId = 'CE';
										}

										// check that capacity id is valid
										if (!App.capacities.some(cc => cc.id === capId)) return;

										// add to array in lookup object
										// TODO this all assumes there's only ONE set of data for each country
										if (!App.scoresByCountry[sRow.code]) {
												App.scoresByCountry[sRow.code] = {
														month: sRow.month,
														year: sRow.year,
														avgScore: null,
														avgCapScores: [],
														indScores: {},
												};
										}
										const c = App.scoresByCountry[sRow.code];
										if (!c.indScores[capId]) c.indScores[capId] = [];
										c.indScores[capId].push({
												indId,
												score: sRow.score,
										});
								});

								// roll up indicator scores and write average capacity and overall scores
								for (const iso in App.scoresByCountry) {
										const c = App.scoresByCountry[iso];
										for (const capId in c.indScores) {
												const capScore = d3.mean(c.indScores[capId], d => d.score);
												c.avgCapScores.push({
														capId,
														score: capScore,
												});
										}
										c.avgScore = d3.mean(c.avgCapScores, d => d.score);
								}

								// save currencies in namespace; set default currency
								App.currencies = Object.assign({}, currencies);
								App.currencyIso = 'USD';

								// Create convenience variable for non-country funder/recipients
								App.nonCountries = App.countries.filter(d => d.country === false && d.NAME !== undefined);

								// Save list of funder and recipient codes
								App.funderCodes = _.unique(_.pluck(App.fundingData, 'donor_code'));
								App.recipientCodes = _.unique(_.pluck(App.fundingData, 'recipient_country'));

								let currentSearchSelection = undefined;

								App.initCountrySearchBar('.nav-search-box', (result) => {
										$('.nav-country-search-input').val(result.NAME);
										currentSearchSelection = result;
										$('.nav-search-control').toggle();
										App.navigateToAnalysisPage(currentSearchSelection, 'funded');
								}, { isReverse: true });

								// call callback and finish progress bar
								if (callback) callback();
								NProgress.done();
						});

				// links
				$('.navbar-brand span').click(() => hasher.setHash(''));
		};

		App.navigateToAnalysisPage = (currentSearchSelection, moneyFlow) => {
				if (currentSearchSelection !== undefined) {
						const iso = currentSearchSelection.ISO2;
						let page;
						if (moneyFlow === 'funded') {
								page = 'd';
						} else {
								page = 'r';
						}
						hasher.setHash(`analysis/${iso}/${page}`);
				}
		};


		/* ------------------ Data Functions ------------------- */
		// reloads the funding data to use GHSA Only or All
		App.loadFundingData = (params = {}) => {
				App.fundingLookup = { ghsa: [] };
				App.recipientLookup = { ghsa: [] };
				const ghsaFilter = params.showGhsaOnly ? (p) => p.ghsa_funding === true : (p) => p;
				// populate lookup variables from funding data
				App.fundingData = App.fundingDataFull.filter(ghsaFilter);
				App.fundingData.forEach((p) => {
						const donor = p.donor_code;
						const recipient = p.recipient_country;

						// store payments in lookup objects
						if (!App.fundingLookup[donor]) App.fundingLookup[donor] = [];
						App.fundingLookup[donor].push(p);
						if (!App.recipientLookup[recipient]) App.recipientLookup[recipient] = [];
						App.recipientLookup[recipient].push(p);

						// GHSA funding: store in 'ghsa' key
						// for both dictionaries
						if (p.ghsa_funding === true) {
								App.fundingLookup['ghsa'].push(p);
								App.recipientLookup['ghsa'].push(p);
						}

						// calculate per year spending/commits
						App.getFundsByYear(p);
				});
		};

		// returns the total amount of money donated by a given country
		App.getTotalFunded = (iso, params = {}) => {
				if (!App.fundingLookup[iso]) return 0;
				let fundsToAdd = [];
				if (iso === 'ghsa') {
						fundsToAdd = Util.uniqueCollection(App.fundingLookup[iso], 'project_id');
				} else {
						fundsToAdd = App.getFinancialProjectsWithAmounts(App.fundingLookup[iso], 'd', iso);
				}

				return App.filterResults(fundsToAdd, params);
		};

		App.filterResults = (fundsToAdd, filter) => {
				if (filter.ccs) {
						fundsToAdd = App.filterOutResultsForCCS(fundsToAdd, filter);
				}

				if (filter.startYear || filter.endYear) {
					return (filter.includeCommitments === true) ?
							d3.sum(fundsToAdd, d=> App.sumYearData(d.spent_by_year, filter)) +
									d3.sum(App.sumYearData(d.committed_by_year, filter)) :
							(filter.committedOnly === true) ? d3.sum(fundsToAdd, d=> App.sumYearData(d.committed_by_year, filter)) :
									d3.sum(fundsToAdd, d=> App.sumYearData(d.spent_by_year, filter));
				}

				if (filter.includeCommitments === true) {
						return d3.sum(fundsToAdd, d => d.total_spent + d.total_committed);
				} else if (filter.committedOnly === true) {
						return d3.sum(fundsToAdd, d => d.total_committed);
				} else {
						return d3.sum(fundsToAdd, d => d.total_spent);
				}
		}

		App.filterOutResultsForCCS = (fundsToAdd, filter) => {
				if (filter.ccs) {
						return fundsToAdd.filter( f => {
								if (f.core_capacities.length == 0 && filter.ccs.includes("")) {
										return f;
								}

								if (f.core_capacities.some(cc=> filter.ccs.includes(cc))) {
										return f;
								}
						});
				}
		}

		App.sumYearData = (yearList, filter) => {
				var startYear = App.dataStartYear;
				var endYear = App.dataEndYear;

				if (filter.startYear) { startYear = filter.startYear; }
				if (filter.endYear) { endYear = filter.endYear; }

				const yearListKeys = Object.keys(yearList).map(Number);
				const filteredYearList = yearListKeys.map(yval => {
						return (yval >= startYear && yval <= endYear) ? yearList["" + yval] : 0;
				});

				return d3.sum(filteredYearList);
		}

		App.getReadyScores = (iso) => {
				function isState(stt) {
						return stt.countryCode === iso;
				}

				if (typeof App.resolve_Scores.find(isState) == 'undefined') {
						return {
								countryName: '?',
								countryCode: iso,
								preventScore: '?',
								readyScore: '?',
								otherScore: '?',
								respondScore: '?',
								detectScore: '?',
						};
				} else {
						return App.resolve_Scores.find(isState);
				}
		};

		App.readyColor = (num) => {
				if (num === '?') {
						return '#2d2d34';
				} else if (num > 79) {
						return App.jeeColors[4];
				} else if (num > 39) {
						return App.jeeColors[1];
				} else {
						return App.jeeColors[0];
				}
		};

		App.readyText = (num) => {
				if (num === '?') {
						return 'Unknown';
				} else if (num > 79) {
						return 'Better Prepared';
				} else if (num > 39) {
						return 'Work to Do';
				} else {
						return 'Not Ready';
				}
		};

		/* App.jeeColors = ['#c91414', '#CCCC33', '#ede929', '#ede929',
		'#ede929', '#0b6422', '#0b6422', '#0b6422'];*/

		App.getInkindFunded = (iso, params = {}) => {
				if (!App.fundingLookup[iso]) return 0;
				let fundsToAdd = [];
				if (iso === 'ghsa') {
						fundsToAdd = Util.uniqueCollection(App.fundingLookup[iso], 'project_id');
				} else {
						fundsToAdd = App.getInkindSupportProjects(App.fundingLookup[iso], 'd', iso);

						if (params.ccs) {
								fundsToAdd = App.filterOutResultsForCCS(fundsToAdd, params);
						}

						fundsToAdd = App.filterOutInKindResultsYears(fundsToAdd, params);
				}
				if (params.includeCommitments === true) {
						return d3.sum(fundsToAdd, d => d.total_spent + d.total_committed);
				} else if (params.committedOnly === true) {
						return fundsToAdd.filter(d => d.commitment_disbursements === 'commitment').length;
						// return d3.sum(fundsToAdd, d => d.total_committed);
				} else {
						return fundsToAdd.filter(d => d.commitment_disbursements === 'disbursement').length;
						// return d3.sum(fundsToAdd, d => d.total_spent);
				}
		};

		App.getInkindReceived = (iso, params = {}) => {
				if (!App.fundingLookup[iso]) return 0;
				let fundsToAdd = [];
				if (iso === 'ghsa') {
						fundsToAdd = Util.uniqueCollection(App.recipientLookup[iso], 'project_id');
				} else {
						fundsToAdd = App.getInkindSupportProjects(App.recipientLookup[iso], 'r', iso);

						if (params.ccs) {
								fundsToAdd = App.filterOutResultsForCCS(fundsToAdd, params);
						}

						fundsToAdd = App.filterOutInKindResultsYears(fundsToAdd, params);
				}
				if (params.includeCommitments === true) {
						return d3.sum(fundsToAdd, d => d.total_spent + d.total_committed);
				} else if (params.committedOnly === true) {
						return fundsToAdd.filter(d => d.commitment_disbursements === 'commitment').length;
						// return d3.sum(fundsToAdd, d => d.total_committed);
				} else {
						return fundsToAdd.filter(d => d.commitment_disbursements === 'disbursement').length;
						// return d3.sum(fundsToAdd, d => d.total_spent);
				}
		};

		App.filterOutInKindResultsYears = (fundsToAdd, filter) => {
				if (filter.startYear || filter.endYear) {
						var startYear = App.dataStartYear;
						var endYear = App.dataEndYear;

						if (filter.startYear) { startYear = filter.startYear; }
						if (filter.endYear) { endYear = filter.endYear; }

						fundsToAdd = fundsToAdd.filter(f => {
							const yearListKeys = f.years.map(Number);
							if (yearListKeys.some(yval => {
									return (Number.isInteger(yval) && yval >= startYear && yval <= endYear);
							})) {
									return f;
							}
						});
				}

				return fundsToAdd;
		}

		// returns the total amount of money received by a given country
		App.getTotalReceived = (iso, params = {}) => {
				if (!App.recipientLookup[iso]) return 0;
				let fundsToAdd = [];
				if (iso === 'ghsa') {
						fundsToAdd = Util.uniqueCollection(App.recipientLookup[iso], 'project_id');
				} else {
						fundsToAdd = App.getFinancialProjectsWithAmounts(App.recipientLookup[iso], 'r', iso);
				}

				return App.filterResults(fundsToAdd, params);
		};

		App.getFundsByYear = (project) => {
				// console.log(project.transactions)
				const transactions = project.transactions;
				const spendTrans = transactions.filter(d => {
						return d.type === 'disbursement' || d.type === 'expenditure';
				});
				const commitmentTrans = transactions.filter(d => {
						return d.type === 'commitment';
				});

				project.total_spent = 0.0;
				project.total_committed = 0.0;
				// const curYear = new Date().getFullYear();
				const curYear = App.dataEndYear;
				const minYear = App.dataStartYear;

				project.spent_by_year = {
						2014: 0.0,
						2015: 0.0,
						2016: 0.0,
						2017: 0.0,
						2018: 0.0,
				};
				spendTrans.forEach(transaction => {
						const transCy = transaction.cy;
						if (project.spent_by_year[transCy] === undefined) {
								project.spent_by_year[transCy] = transaction.amount;
						} else {
								project.spent_by_year[transCy] = project.spent_by_year[transCy] + transaction.amount;
						}
						if (parseInt(transCy) <= curYear && parseInt(transCy) >= minYear) project.total_spent = project.total_spent + transaction.amount;
				});

				project.committed_by_year = {
						2014: 0.0,
						2015: 0.0,
						2016: 0.0,
						2017: 0.0,
						2018: 0.0,
				};
				commitmentTrans.forEach(transaction => {
						const transCy = transaction.cy;
						if (project.committed_by_year[transCy] === undefined) {
								project.committed_by_year[transCy] = transaction.amount;
						} else {
								project.committed_by_year[transCy] = project.committed_by_year[transCy] + transaction.amount;
						}
						if (parseInt(transCy) <= curYear && parseInt(transCy) >= minYear) project.total_committed = project.total_committed + transaction.amount;
				});

				// set negative funds to zero
				transactions.forEach((transaction) => {
						if (transaction.amount < 0) transaction.amount = 0;
				});
		};

		/**
		 * For the entity represented by the code, return the
		 * codes of any groups it belongs to
		 * @param  {string} code 'donor_code' or 'recipient_country'
		 * @return {array}      Array of strings of entity codes of groups the entity belongs to
		 */
		App.getEntityGroups = (code) => {
				const matches = _.pluck(App.geographicGroupings.filter(d => d.iso2 === code), 'group_code');
				return matches || [];
		};

		/**
		 * Given a set of projects, the type (funder/recipient), and the
		 * code of the funder/recipient, returns anything that would be
		 * classified as "Inkind Support", one object per "table row".
		 * @param  {array} projects Array of projects (objects)
		 * @param  {string} type     'd' or 'r'
		 * @param  {string} code     The 'donor_code' or 'recipient_country' to lookup
		 * @return {array}          Array of projects categorized as Other Support
		 */
		App.getInkindSupportProjects = (projects, type, code, params = {}) => {
				if (code === 'ghsa') {
						return projects.filter(d => d.ghsa_funding === true && (d.assistance_type.toLowerCase() === 'in-kind support' || d.assistance_type.toLowerCase() === 'other support'));
				} else {
						const typeIsFunded = type === 'd';
						const codeField = typeIsFunded ? 'donor_code' : 'recipient_country';
						const unspecAmountField = typeIsFunded ? 'donor_amount_unspec' : 'recipient_amount_unspec';
						const groupsPartOf = App.getEntityGroups(code);
						const filterIsCode = (project) => {
								const isSoloProject = project[codeField] === code;
								const isGroupProject = groupsPartOf.indexOf(project[codeField]) > -1;
								return isSoloProject || isGroupProject;
						};

						const filterIsOther = (project) => {
								const projectAssistanceType = project.assistance_type.toLowerCase();
								const isOther = projectAssistanceType === 'in-kind support' || projectAssistanceType === 'other support';
								const isUnspecAmount = project[unspecAmountField] === true || project[codeField] !== code;
								return isOther;
								// return isOther || isUnspecAmount;
						};

						const filterCountOnce = (allProjects) => {
								const groupedById = _.groupBy(allProjects, 'project_id');
								return _.values(groupedById).map(d => d[0]);
						};

						return filterCountOnce(projects.filter(filterIsOther).filter(filterIsCode));
				}
		};

		/**
		 * Given the set of projects, returns only those that contain financial assistance
		 * amounts that are attributable to the entity (either funded or received).
		 * @param  {array} projects The projects
		 * @param  {string} type     'd' or 'r'
		 * @param  {string} code     Entity code
		 * @return {array}          Projects that contain financial assistance with attributable
		 * amounts
		 */
		App.getFinancialProjectsWithAmounts = (projects, type, code) => {
				const typeIsFunded = type === 'd';
				const codeField = typeIsFunded ? 'donor_code' : 'recipient_country';
				const unspecAmountField = typeIsFunded ? 'donor_amount_unspec' : 'recipient_amount_unspec';

				const filterIsCode = (project) => {
						return isSoloProject = project[codeField] === code;
				};

				const filterHasAmount = (project) => {
						return project[unspecAmountField] !== true && project.assistance_type.toLowerCase() !== 'in-kind support' && project.assistance_type.toLowerCase() !== 'other support';
				};

				const filterCountOnce = (allProjects) => {
						const groupedById = _.groupBy(allProjects, 'project_id');
						return _.values(groupedById).map(d => d[0]);
				};

				return filterCountOnce(projects.filter(filterIsCode).filter(filterHasAmount));
		};

		/**
		 * Return projects that match the entity's code or any
		 * group the entity is part of.
		 * @param  {array} projects Array of projects
		 * @param  {string} type     d or r
		 * @param  {string} code     Entity code
		 * @return {array}          Array of matching projects
		 */
		App.getProjectsIncludingGroups = (projects, type, code) => {

				if (code === 'ghsa') {

						// const filterCountOnce = (allProjects) => {
						// 	const groupedById = _.groupBy(allProjects, 'project_id');
						// 	return _.values(groupedById).map(d => d[0]);
						// };

						return projects.filter(d => d.ghsa_funding === true);
				} else {
						const typeIsFunded = type === 'd';
						const codeField = typeIsFunded ? 'donor_code' : 'recipient_country';
						const unspecAmountField = typeIsFunded ? 'donor_amount_unspec' : 'recipient_amount_unspec';

						const dataToCheck = typeIsFunded ? App.fundingLookup : App.recipientLookup;

						// Timor-Leste is part of IPR
						const groupsPartOf = App.getEntityGroups(code);
						groupsPartOf.push(code);

						let data = [];
						groupsPartOf.forEach(group => {
								if (dataToCheck[group] !== undefined) {
										data = data.concat(dataToCheck[group]);
								}
						});

						const filterCountOnce = (allProjects) => {
								const groupedById = _.groupBy(allProjects, 'project_id');
								return _.values(groupedById).map(d => d[0]);
						};

						return filterCountOnce(data);
				}
		};

		/**
		 * Return projects that match the entity's code or any
		 * group the entity is part of, funded by the other enetity
		 * @param  {array} projects Array of projects
		 * @param  {string} type     d or r
		 * @param  {string} code     Entity code
		 * @return {array}          Array of matching projects
		 */
		App.getProjectsIncludingGroupsFlow = (projects, funderCode, recipientCode) => {

				if (funderCode === 'ghsa') {
						return projects.filter(d => d.ghsa_funding === true && d.recipient_country === recipientCode);
				} else if (recipientCode === 'ghsa') {
						return projects.filter(d => d.ghsa_funding === true && d.donor_code === funderCode);
				} else {
						// Timor-Leste is part of IPR
						const funderGroups = App.getEntityGroups(funderCode);
						funderGroups.push(funderCode);

						const recipientGroups = App.getEntityGroups(recipientCode);
						recipientGroups.push(recipientCode);

						let data = [];

						data = projects.filter(project => {
								const isFunder = funderGroups.indexOf(project.donor_code) > -1;
								const isRecipient = recipientGroups.indexOf(project.recipient_country) > -1;
								return isFunder && isRecipient;
						});

						const filterCountOnce = (allProjects) => {
								const groupedById = _.groupBy(allProjects, 'project_id');
								return _.values(groupedById).map(d => d[0]);
						};

						return filterCountOnce(data);
				}
		};

		/**
		 * Returns the tooltip text for Not Reported
		 * @param  {Array} projects Projects from which to pull the "maybe" orgs
		 * @param  {[type]} name     [description]
		 * @param  {[type]} noun     [description]
		 * @return {[type]}          [description]
		 */
		App.getNotReportedMessage = (projects, name, flow) => {

				// If it's not an organization, then use "a multilateral group"
				// If "a multilateral group" is already there then use it once
				const nameField = flow === 'd' ? 'donor_name' : 'recipient_name';
				const nameOrigField = flow === 'd' ? 'donor_name_orig' : 'recipient_name_orig';
				const noun = flow === 'd' ? 'funder' : 'recipient';

				// Extract a list of projects representing the unique names of the F/R
				// that we are looking at
				const projWithName = Util.uniqueCollection(projects, nameField);
				let namesListTmp = [];
				projWithName.forEach(p => {
						// If the recipient's name is not the same as the "name", then
						// push the name; otherwise push the orig name
						if (p[nameField] === name) {
								namesListTmp.push(p[nameOrigField]);
						} else {
								namesListTmp.push(p[nameField]);
						}
				});
				namesListTmp = _.unique(namesListTmp);

				const length = namesListTmp.length;
				let namesList = [];
				let isJustUnspecifiedFinancial = false;
				namesListTmp.forEach(nameListed => {
						isJustUnspecifiedFinancial = nameListed === name;
						if (isJustUnspecifiedFinancial) {
								return;
						}
						const isMultilateralEffort = App.codes.find(d => d.donor_name === nameListed) === undefined;
						if (isMultilateralEffort) nameListed = 'multilateral group';
						namesList.push(nameListed);
				});
				namesList = _.unique(namesList);
				let nameString;
				if (length > 2) {
						namesList[length - 1] = 'and ' + namesList[length - 1];
						nameString = namesList.join(', ');
				} else {
						nameString = namesList.join(' and ');
				}

				const message = `${name} included as ${noun} for ${nameString} projects`;
				if (isJustUnspecifiedFinancial) {
						return `${name} included as ${noun} for projects with unspecified value`;
				}

				return message;
		};

		/**
		 * Returns an array representing the projects in 'projects' that were within
		 * the start and end years, inclusive. This is used to determine which non-IATI
		 * projects are 'unknown value' c/d's
		 * @param  {Array} projects  Projects to check (should be non-IATI ones)
		 * @param  {int} startYear the start year
		 * @param  {int} endYear   the end year
		 * @return {Array}           Projects that were within the year range
		 */
		App.getNonIatiProjectWithinYears = (projects, startYear, endYear) => {
				return projects.filter(p => {
						return p.years.some(year => startYear <= year && endYear >= year);
				});
		};


		/**
		 * Returns array of projects that had 'zero' reported for all commitments and disbursements
		 * by year
		 * @param  {array} projects Array of projects
		 * @return {array}          Array of matching projects
		 */
		App.tagProjectsWithNoValuesReported = (projects) => {
				projects.forEach(p => {
						if (p.assistance_type.toLowerCase().includes('in-kind') || p.assistance_type.toLowerCase().includes('other')) {
								p.no_value_reported = false;
								return;
						}
						const zero = {
								c: _.values(p.committed_by_year).every(val => val <= 0),
								d: _.values(p.spent_by_year).every(val => val <= 0),
						};
						if (zero.c && zero.d) {
								p.no_value_reported = true;
						} else {
								p.no_value_reported = false;
						}
				});
		};

		/**
		 * Given the set of projects, returns only those that contain financial assistance
		 * amounts that are NOT attributable to the entity (either funded or received).
		 * This set of projects is used to determine whether to color a country/entity gray
		 * on the Map -- they are dark gray if there are only projects with unspecified
		 * financials and "Financial Resources" has been selected.
		 * @param  {array} projects The projects
		 * @param  {string} type     'd' or 'r'
		 * @param  {string} code     Entity code
		 * @return {array}          Projects that contain financial assistance WITHOUT attributable
		 * amounts
		 */
		App.getFinancialProjectsWithUnmappableAmounts = (projects, type, code) => {
				const typeIsFunded = type === 'd';
				const codeField = typeIsFunded ? 'donor_code' : 'recipient_country';
				const unspecAmountField = typeIsFunded ? 'donor_amount_unspec' : 'recipient_amount_unspec';

				const dataToCheck = typeIsFunded ? App.fundingLookup : App.recipientLookup;

				// Timor-Leste is part of IPR
				const groupsPartOf = App.getEntityGroups(code);
				groupsPartOf.push(code);

				let data = [];
				groupsPartOf.forEach(group => {
						if (dataToCheck[group] !== undefined) {
								data = data.concat(dataToCheck[group]);
						}
				});
				const ccs = $('.cc-select').val();
				if (ccs === undefined) {
						projects = data;
				} else {
						projects = data.filter(p => {
								// Tagged with right ccs?
								if (!App.passesCategoryFilter(p.core_capacities, ccs)) return false;
								return true;

						});
				}

				// Get financial support that is disbursed to groups TL is part of.
				const filterAmountUnmappable = (project) => {
						// Is financial
						const isUnspecifiedForTarget = project[unspecAmountField] === true;
						const isFinancial = project.assistance_type.toLowerCase().includes('financial');

						// Is for a group Timor-Leste belongs to.
						return isFinancial && isUnspecifiedForTarget;
				};

				const filterCountOnce = (allProjects) => {
						const groupedById = _.groupBy(allProjects, 'project_id');
						return _.values(groupedById).map(d => d[0]);
				};

				return filterCountOnce(projects.filter(filterAmountUnmappable));
		};

		/**
		 * Given the set of projects, returns only those that contain financial assistance
		 * amounts that are NOT attributable to the entity (either funded or received).
		 * This set of projects is used to determine whether to color a country/entity gray
		 * on the Map -- they are dark gray if there are only projects with unspecified
		 * financials and "Financial Resources" has been selected.
		 * @param  {array} projects The projects
		 * @param  {string} type     'd' or 'r'
		 * @param  {string} code     Entity code
		 * @return {array}          Projects that contain financial assistance WITHOUT attributable
		 * amounts
		 */
		App.getInkindProjectsWithUnmappableAmounts = (projects, type, code) => {
				const typeIsFunded = type === 'd';
				const codeField = typeIsFunded ? 'donor_code' : 'recipient_country';
				const unspecAmountField = typeIsFunded ? 'donor_amount_unspec' : 'recipient_amount_unspec';

				const dataToCheck = typeIsFunded ? App.fundingLookup : App.recipientLookup;

				// Timor-Leste is part of IPR
				const groupsPartOf = App.getEntityGroups(code);

				let data = [];
				groupsPartOf.forEach(group => {
						if (dataToCheck[group] !== undefined) {
								data = data.concat(dataToCheck[group]);
						}
				});
				const ccs = $('.cc-select').val();
				if (ccs === undefined) {
						projects = data;
				} else {
						projects = data.filter(p => {
								// Tagged with right ccs?
								if (!App.passesCategoryFilter(p.core_capacities, ccs)) return false;
								return true;

						});
				}

				// Get financial support that is disbursed to groups TL is part of.
				const filterAmountUnmappable = (project) => {
						// Is financial
						const isInkind = project.assistance_type.toLowerCase().includes('other support') || project.assistance_type.toLowerCase().includes('in-kind support');

						// Is for a group Timor-Leste belongs to.
						return isInkind;
				};

				const filterCountOnce = (allProjects) => {
						const groupedById = _.groupBy(allProjects, 'project_id');
						return _.values(groupedById).map(d => d[0]);
				};

				return filterCountOnce(projects.filter(filterAmountUnmappable));
		};


		App.getMappableProjects = (projects, type, code) => {
				const typeIsFunded = type === 'd';
				const codeField = typeIsFunded ? 'donor_code' : 'recipient_country';
				const unspecAmountField = typeIsFunded ? 'donor_amount_unspec' : 'recipient_amount_unspec';

				const filterIsCode = (project) => {
						return project[codeField] === code;
				};

				const filterHasAmount = (project) => {
						return project[unspecAmountField] !== true;
				};

				const filterCountOnce = (allProjects) => {
						const groupedById = _.groupBy(allProjects, 'project_id');
						return _.values(groupedById).map(d => d[0]);
				};

				return filterCountOnce(projects.filter(filterIsCode).filter(filterHasAmount));
		};


		App.addOtherRecipients = (codeObj) => {
				// if not a country
				if (codeObj.donor_sector === 'Government') return;
				const code = codeObj.donor_code;
				const name = codeObj.donor_name;
				if (code === 'ghsa') return;

				// add as a "country"
				App.countries = App.countries.concat(
						{
								'FIPS': code,
								'ISO2': code,
								'NAME': name,
								'acronym': codeObj.acronym,
								'POP2005': 0,
								'regionName': 'Other funders / recipients',
								'subRegionName': 'Other funders / recipients',
								'intermediateRegionName': 'Other funders / recipients',
								'country': false,
						},
				);
		};


		/* ------------------ Misc Functions ------------------- */
		App.getCountryName = (iso) => {
				if (App.codeToNameMap.has(iso)) return App.codeToNameMap.get(iso);
				return iso;
		};

		App.getFlagHtml = (iso) => {

				// If GGB, return the global image
				if (iso === 'General Global Benefit') {
						return '<img class="flag globe" src="img/flags/ggb.png" />';
				}

				// is this country?
				const match = App.countries.find(d => d.ISO2 === iso);
				if (match === undefined || match.country === false) {
						return '';
				} // older flags that have different shapes sometimes
				else {
						return `<img class="flag" src="img/flags/${iso.toLowerCase()}.png" />`;
				}
				// newer flags that are all the same size but still not good
				/* else {
			return `<img class="flag" src="img/newFlags/${App.codeToNameMap.get(iso)}.png" />`;
		}*/
		};

		App.getScoreNameHtml = (score) => {
				let className = '';
				if (score >= 3.5) className = 'text-success';
				if (score < 1.5) className = 'text-danger';
				return `<b class="${className}">${App.getScoreName(score)}</b>`;
		};

		App.getScoreName = (score) => {
				if (score < 1.5) {
						return 'No Capacity';
				} else if (score < 2.5) {
						return 'Limited Capacity';
				} else if (score < 3.5) {
						return 'Developed Capacity';
				} else if (score < 4.5) return 'Demonstrated Capacity';
				return 'Sustained Capacity';
		};

		const sourceNames = [
				'International Aid Transparency Initiative (IATI)',
				'Article X Compendium',
				'2018 US GHSA Progress and Impact Report',
				'Ebola Recovery Tracking Initiative',
				'Nuclear Threat Initiative Commitment Tracker',
				'WHO Contingency Fund for Emergencies',
		];
		App.setSources = () => {

				const linkHtml = '<a href="#about" class="source-text">Data sources</a>';
				let tooltipContent = '<a href="#about#sources" class="no-link data-source-header">Data sources</a><div class="data-source-sep"></div><ul>';
				sourceNames.forEach((sourceName) => {
						tooltipContent += `<li>${sourceName}</li>`;
				});
				tooltipContent += '</ul></div>';
				$('.source-text,.funds-source-text').html(linkHtml)
						.tooltipster({
								minWidth: 400,
								content: tooltipContent,
								contentAsHTML: true,
								interactive: true,
								side: 'bottom',
						});
		};

		App.setGhsaOnly = (ghsaOnly) => {
				App.showGhsaOnly = ghsaOnly;
		};

		App.ghsaInfoTooltipContent = 'The Global Health Security Agenda (GHSA) is a partnership of nations, international organizations, and non-governmental stakeholders to help build countries’ capacity to help create a world safe and secure from infectious disease threats. Only resources that have specifically been identified as being committed or disbursed under the GHSA are identified as GHSA financial resources in the GHS Tracking Dashboard.';
		// App.ghsaInfoTooltipContent = 'The Global Health Security Agenda (GHSA) is a partnership of over 64 nations, international organizations, and non-governmental stakeholders to help build countries’ capacity to help create a world safe and secure from infectious disease threats and elevate global health security as a national and global priority. Only resources that have specifically been identified as being committed or disbursed under the GHSA are identified as GHSA financial resources in the GHS Tracking Dashboard';

		/* ------------------ Data Functions ------------------- */
		/**
		 * Maps the funder references of all projects to the correct entities,
		 * and updates the funder data fields to be correct.
		 * @param  {Collection} projects All the funding data.
		 */
		App.correctDonors = (projects) => {
				// Load updated donor codes
				d3.queue(1)
						.defer(d3.json, 'data/new_donor_codes.json')
						.defer(d3.json, 'data/custom_donor_codes.json')
						.await((error, donorCodeListTmp, customDonorCodeList) => {
								const donorCodeList = donorCodeListTmp.concat(customDonorCodeList);
								console.log('donorCodeList');
								console.log(donorCodeList);

								// For each project, get the donor code data
								projects.forEach(project => {
										if (project.funder_ref === null || project.funder_ref === undefined) return;

										project.funder_ref = project.funder_ref.toLowerCase();

										const donorCode = donorCodeList.find(donorCode => donorCode.donor_code === project.funder_ref);
										if (donorCode === undefined) {
												console.log('No match for: ' + project.funder_ref);
												return;
										}

										// Update donor name, sector, and code accordingly
										project.donor_name = donorCode.donor_name;
										project.donor_sector = donorCode.donor_sector;
										project.donor_code = donorCode.donor_country || donorCode.donor_code;

								});

						});
				// Save it out
				console.log('projects');
				console.log(projects);
				Util.save(projects);
		};


		/* ------------------ Format Functions ------------------- */
		App.siFormat = (num) => {
				if (!num) return '0';
				return d3.format(',.3s')(num).replace('G', 'B');
		};
		App.percentFormat = (num) => {
				return d3.format('.0%')(num);
		};

		App.formatMoneyShort = (usdValue) => {
				const multiplier = App.currencies[App.currencyIso].exchange_rates
						.find(er => er.convert_from === 'USD')
						.multiplier;
				const value = usdValue * multiplier;
				if (value < 100) return Math.round(value);
				return App.siFormat(value);
		};
		App.formatMoneyFormatted = usdValue => `${App.formatMoneyShort(usdValue)} <span>${App.currencyIso}</span>`;
		App.formatMoney = usdValue => `${App.formatMoneyShort(usdValue)} ${App.currencyIso}`;
		App.formatMoneyFull = (usdValue) => {
				if (usdValue < 100) return `${Math.round(usdValue)} ${App.currencyIso}`;
				return `${d3.format(',.3r')(usdValue)} ${App.currencyIso}`;
		};
		App.formatInkind = (val) => {
				if (val !== 1) {
						return Util.comma(val) + ' projects';
				} else {
						return Util.comma(val) + ' project';
				}
		};


		/* ------------------ Vendor Defaults ------------------- */
		// change number of paging buttons shown in DataTables
		$.fn.DataTable.ext.pager.numbers_length = 6;

		// add sorting algorithm to DataTables library
		$.fn.dataTableExt.oSort['money-asc'] = (a, b) => {
				const aVal = Util.strToFloat(a);
				const bVal = Util.strToFloat(b);
				if (aVal < bVal) return -1;
				return aVal > bVal ? 1 : 0;
		};
		$.fn.dataTableExt.oSort['money-desc'] = (a, b) => {
				const aVal = Util.strToFloat(a);
				const bVal = Util.strToFloat(b);
				if (aVal < bVal) return 1;
				return aVal > bVal ? -1 : 0;
		};

		// tooltipster defaults
		$.tooltipster.setDefaults({
				contentAsHTML: true,
				trigger: 'hover',
				offset: [5, -25],
				theme: 'tooltipster-shadow',
				maxWidth: 320,
		});

		// noty defaults
		$.noty.defaults.type = 'warning';
		$.noty.defaults.layout = 'center';
		$.noty.defaults.timeout = 2000;

})();
