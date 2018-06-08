(() => {
	// variables used for info box
	let infoDataTable;  // the info data table (DataTable object)
	let infoTableHasBeenInit = false;  // whether the info data table has been initialized
	let currentInfoTab = 'all';  // the current info tab (all, country, function, disease)

	App.initAnalysisTable = (iso, moneyFlow) => {
		const country = App.countries.find(c => c.ISO2 === iso);
		const name = App.codeToNameMap.get(iso);
		const isGhsaPage = iso === 'ghsa';

		// find all payments funded or received by this country
		App.loadFundingData({ showGhsaOnly: App.showGhsaOnly });
		let allPayments = [];
		if (moneyFlow === 'd' && App.fundingLookup[iso]) {
			allPayments = App.fundingLookup[iso].slice(0);
		}
		if (moneyFlow === 'r' && App.recipientLookup[iso]) {
			allPayments = App.recipientLookup[iso].slice(0);
		}

		// define content in container
		function init() {
            App.setSources();
			// fill title
			const flagHtml = country ? App.getFlagHtml(iso) : '';
			$('.analysis-country-title')
				.html(`${flagHtml} ${name} ${flagHtml}`)
				.on('click', () => hasher.setHash(`analysis/${iso}`));

			// fill in other text
			$('.money-type-noun').text(moneyFlow === 'd' ? 'Funder' : 'Recipient');
			$('.opp-money-type-noun').text(moneyFlow === 'd' ? 'Recipient' : 'Funder');
			$('.money-type-cap').text(moneyFlow === 'd' ? 'Disbursed' : 'Received');
			$('.commit-noun').text(moneyFlow === 'd' ? 'Committed Funds' :
				'Committed Funds to Receive');
			$('.start-year').text(App.dataStartYear);
			$('.end-year').text(App.dataEndYear);

			// fill summary text
			const totalCommitted = d3.sum(allPayments, d => d.total_committed);
			const totalSpent = d3.sum(allPayments, d => d.total_spent);
			$('.committed-value').text(App.formatMoney(totalCommitted));
			$('.spent-value').text(App.formatMoney(totalSpent));

			// back button behavior
			$('.back-button').click(() => hasher.setHash(`analysis/${iso}/${moneyFlow}`));

			// start up tabs and table
			initInfoTabs();
			updateInfoTab();
			updateInfoTable();
			initGhsaToggle();
		}

		function initGhsaToggle() {
			// set GHSA radio button to checked if that is set
			if (App.showGhsaOnly) {
				$(`input[type=radio][name="ind-table"][ind="ghsa"]`).prop('checked',true);
			}

			$('.analysis-table .ind-type-filter .radio-option').off('click');
			$('.analysis-table .ind-type-filter .radio-option').click(function updateIndType() {
				console.log('toggle switch')
				// Load correct funding data
				indType = $(this).find('input').attr('ind');
				App.showGhsaOnly = indType === 'ghsa';
				
				// Reload profile graphics and data
				crossroads.parse(hasher.getHash());
				// hasher.setHash(`analysis/${iso}/${moneyFlow}/table${App.showGhsaOnly ? '?ghsa_only=true' : '?ghsa_only=false'}`);
			});

			// if on the special GHSA page, don't show this toggle
			if (isGhsaPage) {
				$('.ghsa-toggle-options').remove();
				d3.select('.analysis-country-title').append('img')
					.attr('class', 'ghsa-info-img info-img')
					.attr('src','img/info.png');
			}

			// init tooltip
			$('.ghsa-info-img').tooltipster({
				interactive: true,
				content: App.ghsaInfoTooltipContent,
			});
		}

		// define info table tab behavior
		function initInfoTabs() {
			$('.funds-tab-container .btn').on('click', function changeTab() {
				currentInfoTab = $(this).attr('tab');
				updateInfoTab();
				updateInfoTable();
			});
		}

		// update the content shwon based on tab chosen
		function updateInfoTab() {
			// make correct tab active
			$(`.funds-tab-container .btn[tab="${currentInfoTab}"]`)
				.addClass('active')
				.siblings().removeClass('active');
		}

		// update the table content depending on tab chosen
		function updateInfoTable() {
			// define column data
			let headerData = [];
			if (currentInfoTab === 'all') {
				headerData = [
					{ name: 'Funder', value: 'donor_name' },
					{ name: 'Recipient', value: 'recipient_name' },
					{ name: 'Project Name', value: 'project_name' },
					{ name: 'Committed', value: 'total_committed', type: 'money' },
					{ name: 'Disbursed', value: 'total_spent', type: 'money' },
				];
			} else if (currentInfoTab === 'country') {
				headerData = [
					{ name: 'Funder', value: d => App.codeToNameMap.get(d.donor_code) },
					{ name: 'Recipient', value: (d) => {
						if (App.codeToNameMap.has(d.recipient_country)) {
							return App.codeToNameMap.get(d.recipient_country);
						}
						return d.recipient_country;
					} },
					{ name: 'Committed', value: 'total_committed', type: 'money' },
					{ name: 'Disbursed', value: 'total_spent', type: 'money' },
				];
			} else if (currentInfoTab === 'ce') {
				headerData = [
					{
						name: 'Core Element',
						value: (d) => {
							if (d.ce === 'P') return 'Prevent';
							if (d.ce === 'D') return 'Detect';
							if (d.ce === 'R') return 'Respond';
							if (d.ce === 'O') return 'Other';
							return 'None';
						},
					},
					{ name: 'Committed', value: 'total_committed', type: 'money' },
					{ name: 'Disbursed', value: 'total_spent', type: 'money' },
					{ name: 'In-kind Contributions', value: 'total_inkind', type: 'number' },
				];
			} else if (currentInfoTab === 'cc') {
				headerData = [
					{
						name: 'Core Capacity',
						value: (d) => {
							const cap = App.capacities.find(cc => cc.id === d.cc);
							return cap ? cap.name : d.cc;
						},
					},
					{ name: 'Committed', value: 'total_committed', type: 'money' },
					{ name: 'Disbursed', value: 'total_spent', type: 'money' },
					{ name: 'In-kind Contributions', value: 'total_inkind', type: 'number' },
				];
			} else if (currentInfoTab === 'inkind') {
				headerData = [
					{ name: 'Provider', value: 'donor_name' },
					{ name: 'Recipient', value: 'recipient_name' },
					{ name: 'Name', value: 'project_name' },
					{ name: 'Description', value: 'project_description' },
				];
			} 

			// define row data
			let paymentTableData = [];
			if (currentInfoTab === 'all') {
				paymentTableData = allPayments.slice(0).filter(payment => payment.assistance_type.toLowerCase() !== 'in-kind support');
			} else if (currentInfoTab === 'country') {
				const totalByCountry = {};
				allPayments.filter(payment => payment.assistance_type.toLowerCase() !== 'in-kind support').forEach((p) => {
					const dc = p.donor_code;
					let rc = p.recipient_country;
					if (rc === 'Not reported') rc = p.recipient_name;
					if (!totalByCountry[dc]) totalByCountry[dc] = {};
					if (!totalByCountry[dc][rc]) {
						totalByCountry[dc][rc] = {
							total_committed: 0,
							total_spent: 0,
						};
					}
					totalByCountry[dc][rc].total_committed += p.total_committed;
					totalByCountry[dc][rc].total_spent += p.total_spent;
				});
				for (const dc in totalByCountry) {
					for (const rc in totalByCountry[dc]) {
						paymentTableData.push({
							donor_code: dc,
							recipient_country: rc,
							total_committed: totalByCountry[dc][rc].total_committed,
							total_spent: totalByCountry[dc][rc].total_spent,
						});
					}
				}
			} else if (currentInfoTab === 'ce') {
				const totalByCe = {};
				const coreElements = ['P', 'D', 'R', 'O'];
				coreElements.concat('None').forEach((ce) => {
					totalByCe[ce] = {
						total_committed: 0,
						total_spent: 0,
						total_inkind: 0,
					};
				});
				allPayments.forEach((p) => {
					let hasACe = false;
					coreElements.forEach((ce) => {
						const hasCe = p.core_capacities.some((cc) => {
							if (ce === 'O') {
								const firstThree = cc.slice(0, 3);
								return firstThree === 'PoE' || firstThree === 'CE' || firstThree === 'RE';
							}
							return cc.slice(0, 2) === `${ce}.`;
						});
						if (hasCe) {
							hasACe = true;
							totalByCe[ce].total_committed += p.total_committed;
							totalByCe[ce].total_spent += p.total_spent;
							totalByCe[ce].total_inkind += (p.assistance_type.toLowerCase() === "in-kind support") ? 1 : 0;
						}
					});
					if (!hasACe) {
						totalByCe.None.total_committed += p.total_committed;
						totalByCe.None.total_spent += p.total_spent;
						totalByCe.None.total_inkind += (p.assistance_type.toLowerCase() === "in-kind support") ? 1 : 0;
					}
				});
				for (const ce in totalByCe) {
					paymentTableData.push({
						ce,
						total_committed: totalByCe[ce].total_committed,
						total_spent: totalByCe[ce].total_spent,
						total_inkind: totalByCe[ce].total_inkind,
					});
				}
			} else if (currentInfoTab === 'cc') {
				const totalByCc = {};
				App.capacities.concat({ id: 'None' }).forEach((cc) => {
					totalByCc[cc.id] = {
						total_committed: 0,
						total_spent: 0,
						total_inkind: 0,
					};
				});
				allPayments.forEach((p) => {
					p.core_capacities.forEach((cc) => {
						if (totalByCc[cc]) {
							totalByCc[cc].total_committed += p.total_committed;
							totalByCc[cc].total_spent += p.total_spent;
							totalByCc[cc].total_inkind += (p.assistance_type.toLowerCase() === "in-kind support") ? 1 : 0;
						}
					});
					if (!p.core_capacities.length) {
						totalByCc.None.total_committed += p.total_committed;
						totalByCc.None.total_spent += p.total_spent;
						totalByCc.None.total_inkind += (p.assistance_type.toLowerCase() === "in-kind support") ? 1 : 0;
					}
				});
				for (const cc in totalByCc) {
					paymentTableData.push({
						cc,
						total_committed: totalByCc[cc].total_committed,
						total_spent: totalByCc[cc].total_spent,
						total_inkind: totalByCc[cc].total_inkind,
					});
				}
			} else if (currentInfoTab === 'inkind') {
				paymentTableData = allPayments.slice(0).filter(payment => payment.assistance_type.toLowerCase() === 'in-kind support');
			} 


			// clear DataTables plugin from table
			if (infoTableHasBeenInit) infoDataTable.destroy();

			// populate table
			const infoTable = d3.select('.funds-table');
			const infoThead = infoTable.select('thead tr');
			const headers = infoThead.selectAll('th')
				.data(headerData);
			headers.exit().remove();
			headers.enter().append('th')
				.merge(headers)
				.classed('money-cell', d => d.type === 'money')
				.classed('inkind-cell', d => d.value === 'total_inkind')
				.text(d => d.name);

			const infoTbody = infoTable.select('tbody');
			const rows = infoTbody.selectAll('tr')
				.data(paymentTableData);
			rows.exit().remove();
			const newRows = rows.enter().append('tr');
			newRows.merge(rows).on('click', (p) => {
				if ((currentInfoTab !== 'cc' && currentInfoTab !== 'ce')) {
					// clicking on a row navigates user to country pair page
					hasher.setHash(`analysis/${p.donor_code}/${p.recipient_country}`);
				}
			});

			const cells = newRows.merge(rows).selectAll('td')
				.data(d => headerData.map(c => ({ rowData: d, colData: c })));
			cells.exit().remove();
			cells.enter().append('td')
				.merge(cells)
				.classed('money-cell', d => d.colData.type === 'money')
				.classed('inkind-cell', d => d.colData.value === 'total_inkind')
				.text((d) => {
					let cellValue = '';
					if (typeof d.colData.value === 'function') {
						cellValue = d.colData.value(d.rowData);
					} else {
						cellValue = d.rowData[d.colData.value];
					}
					if (d.colData.type === 'money') return App.formatMoneyFull(cellValue);
					return cellValue;
				});

			// define DataTables plugin parameters
			let order = [4, 'desc'];
			let columnDefs = [];
			if (currentInfoTab === 'all') {
				columnDefs = [
					{ targets: [0, 1], width: '140px' },
					{ type: 'money', targets: [3, 4], width: '110px' },
				];
			} else if (currentInfoTab === 'country') {
				order = [3, 'desc'];
				columnDefs = [
					{ targets: [0, 1], width: '150px' },
					{ type: 'money', targets: [2, 3], width: '120px' },
				];
			} else if (currentInfoTab === 'ce' || currentInfoTab === 'cc') {
				order = [2, 'desc'];
				columnDefs = [{ type: 'money', targets: [1, 2, 3], width: '120px' }];
			} else if (currentInfoTab === 'inkind') {
				order = [1, 'desc'];
				columnDefs = [{ targets: [3], width: '450px' }];
			} 

			// re-initialize DataTables plugin
			infoDataTable = $('.funds-table').DataTable({
				scrollY: '40vh',
				scrollCollapse: true,
				order,
				columnDefs,
			});
			infoTableHasBeenInit = true;
		}

		init();
	};
})();
