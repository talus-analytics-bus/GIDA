(() => {
	App.initAnalysisGlobal = () => {
		let currentTab = 'global';
		let startYear = App.dataStartYear;
		let endYear = App.dataEndYear;

		function init() {
			initTabs();
			populateFilters();
			initSlider();
			initSearch();
			updateTab();
			populateTables('.donor-table', '.recipient-table');
			drawNetworkMap('.network-map-content');
		}

		function initTabs() {
			// define info table tab behavior
			$('.analysis-global-tab-container .btn').on('click', function changeTab() {
				currentTab = $(this).attr('tab');
				updateTab();
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
			Util.populateSelect('.cc-select', App.capacities, {
				valKey: 'id',
				nameKey: 'name',
				selected: true,
			});
			$('.cc-select').multiselect({
				maxHeight: 260,
				includeSelectAllOption: true,
				enableClickableOptGroups: true,
				numberDisplayed: 0,
			});
		}

		// initializes slider functionality
		function initSlider() {
			const slider = App.initSlider('.time-slider', {
				min: App.dataStartYear,
				max: App.dataEndYear,
				value: [startYear, endYear],
				tooltip: 'hide',
			})
			slider.on('change', (event) => {
				const years = event.target.value.split(',');
				if (+years[0] !== startYear || +years[1] !== endYear) {
					startYear = +years[0];
					endYear = +years[1];
					// TODO
				}
			});
			return slider;
		}

		// initializes search functionality
		function initSearch() {
			App.initCountrySearchBar('.network-country-search', (result) => {
				hasher.setHash(`analysis/${result.ISO2}`);
			});
			App.initCountrySearchBar('.table-country-search', (result) => {
				hasher.setHash(`analysis/${result.ISO2}`);
			});
		}

		function populateTables(donorSelector, recSelector) {
			const numRows = 10;

			// get top funded countries
			const countriesByFunding = [];
			for (let iso in App.fundingLookup) {
				const country = App.countries.find(c => c.ISO2 === iso);
				countriesByFunding.push({
					iso,
					name: country ? country.NAME : iso,
					total_committed: d3.sum(App.fundingLookup[iso], d => d.total_committed),
					total_spent: d3.sum(App.fundingLookup[iso], d => d.total_spent),
				});
			}
			Util.sortByKey(countriesByFunding, 'total_spent', true);

			// get top recipient countries
			const countriesByReceived = [];
			for (let iso in App.recipientLookup) {
				const country = App.countries.find(c => c.ISO2 === iso);
				countriesByReceived.push({
					iso,
					name: country ? country.NAME : iso,
					total_committed: d3.sum(App.recipientLookup[iso], d => d.total_committed),
					total_spent: d3.sum(App.recipientLookup[iso], d => d.total_spent),
				});
			}
			Util.sortByKey(countriesByReceived, 'total_spent', true);

			// populate tables
			const dRows = d3.select(donorSelector).select('tbody').selectAll('tr')
				.data(countriesByFunding.slice(0, numRows))
				.enter().append('tr')
					.on('click', (d) => {
						if (d.iso.length === 2) hasher.setHash(`analysis/${d.iso}`);
					});
			dRows.append('td').html((d) => {
				const country = App.countries.find(c => c.ISO2 === d.iso);
				const flagHtml = country ? App.getFlagHtml(d.iso) : '';
				return `<div class="flag-container">${flagHtml}</div><b>${d.name}</b>`;
			});
			dRows.append('td').text(d => App.formatMoney(d.total_committed));
			dRows.append('td').text(d => App.formatMoney(d.total_spent));

			const rRows = d3.select(recSelector).select('tbody').selectAll('tr')
				.data(countriesByReceived.slice(0, numRows))
				.enter().append('tr');
			rRows.append('td').html((d) => {
				const country = App.countries.find(c => c.ISO2 === d.iso);
				const flagHtml = country ? App.getFlagHtml(d.iso) : '';
				return `<div class="flag-container">${flagHtml}</div><b>${d.name}</b>`;
			});
			rRows.append('td').text(d => App.formatMoney(d.total_committed));
			rRows.append('td').text(d => App.formatMoney(d.total_spent));
		}

		function drawNetworkMap(selector) {
			// collate the data
			const fundedData = [];
			const receivedData = [];
			const chordData = [];
			const fundsByRegion = {};
			for (let i = 0; i < App.countries.length; i++) {
				const c = App.countries[i];
				const iso = c.ISO2;
				const fundedPayments = App.fundingLookup[iso];
				const receivedPayments = App.recipientLookup[iso];

				// construct chord data; sort by region and subregion
				let totalFunded = 0;
				let totalReceived = 0;
				if (fundedPayments) totalFunded = d3.sum(fundedPayments, d => d.total_spent);
				if (receivedPayments) totalReceived = d3.sum(receivedPayments, d => d.total_spent);
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
							if (p.total_spent) {
								// check that the recipient is a valid country
								const rIso = p.recipient_country;
								const rCountry = App.countries.find(c => c.ISO2 === rIso);
								if (rCountry) {
									const rName = rCountry.NAME;
									if (!fundsByRegion[region][sub][iso].fundsByC[rName]) {
										fundsByRegion[region][sub][iso].fundsByC[rName] = 0;
									}
									fundsByRegion[region][sub][iso].fundsByC[rName] += p.total_spent;
								}
							}
						});
					}
				}
			}

			// build chord chart data
			for (let r in fundsByRegion) {
				const region = {
					name: r,
					children: [],
					totalFunded: 0,
					totalReceived: 0,
					totalFlow: 0,
				};
				for (let sub in fundsByRegion[r]) {
					const subregion = {
						name: sub,
						children: [],
						totalFunded: 0,
						totalReceived: 0,
						totalFlow: 0,
					};
					for (let iso in fundsByRegion[r][sub]) {
						const country = App.countries.find(c => c.ISO2 === iso);
						const funds = [];
						for (let rName in fundsByRegion[r][sub][iso].fundsByC) {
							funds.push({
								donor: country.NAME,
								recipient: rName,
								value: fundsByRegion[r][sub][iso].fundsByC[rName],
							});
						}
						const totalFunded = fundsByRegion[r][sub][iso].totalFunded;
						const totalReceived = fundsByRegion[r][sub][iso].totalReceived;
						subregion.children.push({
							name: country.NAME,
							iso: iso,
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
				chordData.push(region);
			}

			// build the charts
			App.buildChordDiagram(selector, chordData);
		}

		init();
	};
})();
