(() => {
	// variables used for info box
	let infoDataTable;  // the info data table (DataTable object)
	let infoTableHasBeenInit = false;  // whether the info data table has been initialized
	let currentInfoTab = 'all';  // the current info tab (all, country, function, disease)

	App.initAnalysisPair = (fundIso, recIso) => {
		// define content in container
		const content = d3.select('.analysis-pair-content');
		const $content = $('.analysis-pair-content');
		const ghsaIncluded = fundIso === 'ghsa' || recIso === 'ghsa';

		App.loadFundingData({ showGhsaOnly: App.showGhsaOnly });

		// get country info
		const donorCountry = App.countries.find(c => c.ISO2 === fundIso);
		const recipientCountry = App.countries.find(c => c.ISO2 === recIso);
		const donorName = App.codeToNameMap.get(fundIso);
		const recipientName = App.codeToNameMap.get(recIso);

		// get payments between the countries
		let allPayments = [];
		if (App.fundingLookup[fundIso]) {
			if (recIso === 'ghsa') {
				allPayments = App.fundingLookup[fundIso].filter(p =>
					p.ghsa_funding === true);
			} else {
				allPayments = App.fundingLookup[fundIso].filter(p =>
					p.recipient_country === recIso);
			}
		}

		function init() {
            App.setSources();
			// fill title
			const fundFlagHtml = donorCountry ? App.getFlagHtml(fundIso) : '';
			const recFlagHtml = recipientCountry ? App.getFlagHtml(recIso) : '';
			const fundOnClick = `hasher.setHash('analysis/${fundIso}/d')`;
			const recOnClick = `hasher.setHash('analysis/${recIso}/r')`;
			const donorNameHtml = `<span class="funder-name" onclick="${fundOnClick}">${donorName}</span>`;
			const recipientNameHtml = `<span class="recipient-name" onclick="${recOnClick}">${recipientName}</span>`;
			$content.find('.analysis-country-title').html(`${fundFlagHtml} ${donorNameHtml} ` +
				`<div class="arrow-html">&rarr;</div> ${recipientNameHtml} ${recFlagHtml}`);

			// fill out generic text
			$('.start-year').text(App.dataStartYear);
			$('.end-year').text(App.dataEndYear);

			// fill summary text
			const financialPayments = App.getFinancialProjectsWithAmounts(allPayments, 'r', recIso)
			const totalCommitted = d3.sum(financialPayments, d => d.total_committed);
			const totalSpent = d3.sum(financialPayments, d => d.total_spent);
			$('.committed-value').text(App.formatMoney(totalCommitted));
			$('.spent-value').text(App.formatMoney(totalSpent));

			// getting back buttons
			$('.donor-button').click(() => hasher.setHash(`analysis/${fundIso}/d`));
			$('.recipient-button').click(() => hasher.setHash(`analysis/${recIso}/r`));

			// define info table tab behavior
			$content.find('.funds-tab-container .btn').on('click', function changeTab() {
				currentInfoTab = $(this).attr('tab');
				updateInfoTab();
				updateInfoTable();
			});

			// fill table content

			// if the info tab was set in a global variable,
			// use that tab and clear the global variable
			if (App.infoTab !== undefined) {
				currentInfoTab = App.infoTab;
				App.infoTab = undefined;
			} else {
				currentInfoTab = 'all';
			}
			updateInfoTab();
			updateInfoTable();
			initGhsaToggle();
		}

		function initGhsaToggle() {
			// set GHSA radio button to checked if that is set
			if (App.showGhsaOnly) {
				$(`input[type=radio][name="ind-pair"][ind="ghsa"]`).prop('checked',true);
			}

			$('.analysis-table.analysis-pair .ind-type-filter .radio-option').off('click');
			$('.analysis-table.analysis-pair .ind-type-filter .radio-option').click(function updateIndType() {
				console.log('toggle switch')
				// Load correct funding data
				indType = $(this).find('input').attr('ind');
				App.showGhsaOnly = indType === 'ghsa';

				// Reload profile graphics and data
				crossroads.parse(hasher.getHash());
				// hasher.setHash(`analysis/${iso}/${moneyFlow}/table${App.showGhsaOnly ? '?ghsa_only=true' : '?ghsa_only=false'}`);
			});

			// if on the special GHSA page, don't show this toggle
			if (ghsaIncluded) {
				$('.ghsa-toggle-options').remove();
				const ghsaNameSelector = recIso === 'ghsa' ? 'span.recipient-name' : 'span.funder-name';
				d3.select(ghsaNameSelector).append('img')
					.style('margin-left', '5px')
					.attr('class', 'ghsa-info-img info-img')
					.attr('src','img/info.png');
			}

			// init tooltip
			$('.ghsa-info-img').tooltipster({
				interactive: true,
				content: App.ghsaInfoTooltipContent,
			});
		}

		// update the content shwon based on tab chosen
		function updateInfoTab() {
			// make correct tab active
			$content.find(`.funds-tab-container .btn[tab="${currentInfoTab}"]`)
				.addClass('active')
				.siblings().removeClass('active');
		}

		// update the table content depending on tab chosen
		function updateInfoTable() {

			const expectedNameR = App.codeToNameMap.get(recIso);
			const expectedNameFieldR = 'recipient_name';
			const expectedNameOrigFieldR = 'recipient_name_orig';

			const expectedNameF = App.codeToNameMap.get(fundIso);
			const expectedNameFieldF = 'donor_name';
			const expectedNameOrigFieldF = 'donor_name_orig';


			function getMoneyCellValue (d, moneyField) {
				const allValuesUnspec = d.all_unspec === true;
				const noValueReported = d.no_value_reported === true;

				if (noValueReported || allValuesUnspec) return 'Specific amount unknown';
				else if (d[expectedNameOrigFieldR] && d[expectedNameOrigFieldR] !== expectedNameR)
					return 'Specific amount unknown';
				else if (recIso !== d.recipient_country)
					return 'Specific amount unknown';
				else if (fundIso !== 'ghsa') {
					if (d[expectedNameOrigFieldF] && d[expectedNameOrigFieldF] !== expectedNameF)
						return 'Specific amount unknown';
					else if (fundIso !== d.donor_code)
						return 'Specific amount unknown';
					else return d[moneyField];
				}
				else return d[moneyField];
			};

			function getMoneyCellValue (d, moneyField, param = {}) {
			const unspecified = param.unspecifiedIsZero === true ? 0 : 'Specific amount unknown';
				const allValuesUnspec = d.all_unspec === true;
				const noValueReported = d.no_value_reported === true;
				let returnFunc = (moneyField !== 'total_other_d' && moneyField !== 'total_other_c') ? (p) => { return p[moneyField]; } : (p) => { return (p.assistance_type.toLowerCase() === "in-kind support" || p.assistance_type.toLowerCase() === "other support") ? 1 : 0 };
				if (moneyField === 'total_other_d' || moneyField === 'total_other_c') {
					if (moneyField === 'total_other_d') {
						returnFunc = (p) => {
							const isInkind = p.assistance_type.toLowerCase() === "in-kind support" || p.assistance_type.toLowerCase() === "other support";
							return (isInkind && p.commitment_disbursements === 'disbursement') ? 1 : 0;
						};
					} else {
						returnFunc = (p) => {
							const isInkind = p.assistance_type.toLowerCase() === "in-kind support" || p.assistance_type.toLowerCase() === "other support";
							return (isInkind && p.commitment_disbursements === 'commitment') ? 1 : 0;
						};
					}
				}
				if (noValueReported || allValuesUnspec) return unspecified;
				else if (d[expectedNameOrigFieldR] && d[expectedNameOrigFieldR] !== expectedNameR)
					return unspecified;
				else if (recIso !== d.recipient_country)
					return unspecified;
				else if (fundIso !== 'ghsa') {
					if (d[expectedNameOrigFieldF] && d[expectedNameOrigFieldF] !== expectedNameF)
						return unspecified;
					else if (fundIso !== d.donor_code)
						return unspecified;
					else return d[moneyField];
				}
				else return d[moneyField];
			};

			// define column data
			let headerData = [];
			if (currentInfoTab === 'all') {
				headerData = [
					// { name: 'Funder', value: 'donor_name' },
					{ name: 'Funder', value: 'donor_name', valueFunc: (p) => { return p.donor_name_orig || p.donor_name; } },
					{ name: 'Recipient', value: 'recipient_name', valueFunc: (p) => { return p.recipient_name_orig || p.recipient_name; } },
					{ name: 'Name', value: 'project_name' },
					{ name: 'Committed', value: 'total_committed', type: 'money', valueFunc: (p) => { return getMoneyCellValue(p, 'total_committed'); } },
					{ name: 'Disbursed', value: 'total_spent', type: 'money', valueFunc: (p) => { return getMoneyCellValue(p, 'total_spent'); } },
				];
			} else if (currentInfoTab === 'cc') {
				headerData = [
					{
						name: 'Core Capacity',
						value: (d) => {
							const cap = App.capacities.find(cc => cc.id === d.cc);
							if (cap && cap.name === 'General IHR Implementation') return cap.name + ' <img class="general-ihr-info-img info-img" src="img/info.png" />';
							return cap ? cap.name : d.cc;
						},
					},
					{ name: 'Committed funds', value: 'total_committed', type: 'money' },
					{ name: 'Disbursed funds', value: 'total_spent', type: 'money' },
					{ name: 'Committed in-kind projects', value: 'total_other_c', type: 'num', supportType: 'inkind' },
					{ name: 'Disbursed in-kind projects', value: 'total_other_d', type: 'num', supportType: 'inkind' },
				];
			} else if (currentInfoTab === 'inkind') {
				headerData = [
					{ name: 'Provider', value: 'donor_name', valueFunc: (p) => { return p.donor_name_orig || p.donor_name; } },
					{ name: 'Recipient', value: 'recipient_name', value2: 'recipient_name_orig', valueFunc: (p) => { return p.recipient_name_orig || p.recipient_name; }  },
					{ name: 'Commitment or disbursement', value: 'commitment_disbursements', valueFunc: (p) => { const lower = p.commitment_disbursements; return lower.charAt(0).toUpperCase() + lower.substr(1); }},
					{ name: 'Description', value: 'project_name' },
				];
			}

			// define row data
			let paymentTableData = [];
			allPayments = App.getProjectsIncludingGroupsFlow(App.fundingData, fundIso, recIso);
			const unspecified = 'Specific amount unknown';
			if (currentInfoTab === 'all') {
				paymentTableData = allPayments.filter(payment => payment.assistance_type.toLowerCase() !== 'in-kind support' && payment.assistance_type.toLowerCase() !== 'other support');
			} else if (currentInfoTab === 'cc') {
				const totalByCc = {};
				allPayments.forEach((p) => {
					p.core_capacities.forEach((cc) => {
						if (!totalByCc[cc]) {
							totalByCc[cc] = {
								total_committed: 0,
								total_spent: 0,
								total_other_d: 0,
								total_other_c: 0,
								had_no_unspecified_money_projects: true, // if zero
								had_no_unspecified_inkind_projects: true, // if zero
							};
						}
						totalByCc[cc].total_committed += getMoneyCellValue(p, 'total_committed', {unspecifiedIsZero: true});
						totalByCc[cc].total_spent += getMoneyCellValue(p, 'total_spent', {unspecifiedIsZero: true});
						totalByCc[cc].total_other_d += getMoneyCellValue(p, 'total_other_d', {unspecifiedIsZero: true});
						totalByCc[cc].total_other_c += getMoneyCellValue(p, 'total_other_c', {unspecifiedIsZero: true});


						const isInkind = (p.assistance_type.includes('ther') || p.assistance_type.includes('n-kind'));
						const wasUnspecifiedInkind = getMoneyCellValue(p, 'total_other_d', {unspecifiedIsZero: false}) === unspecified;
						if (isInkind && wasUnspecifiedInkind) totalByCc[cc].had_no_unspecified_inkind_projects = false;

						const wasUnspecifiedMoney = getMoneyCellValue(p, 'total_committed', {unspecifiedIsZero: false}) === unspecified;
						if (!isInkind && wasUnspecifiedMoney) totalByCc[cc].had_no_unspecified_money_projects = false;
					});
				});
				function getDisplayValForCc (val, key) {
					if (val[key] > 0) return val[key];
					if (key.includes('other') && !val.had_no_unspecified_inkind_projects) return unspecified;
					if (!key.includes('other') && !val.had_no_unspecified_money_projects) return unspecified;
					else return 0;
				};

				for (const cc in totalByCc) {
					console.log(cc);
					paymentTableData.push({
						cc: cc || "None",
						total_committed: getDisplayValForCc(totalByCc[cc], 'total_committed'),
						total_spent: getDisplayValForCc(totalByCc[cc], 'total_spent'),
						total_other_d: getDisplayValForCc(totalByCc[cc], 'total_other_d'),
						total_other_c: getDisplayValForCc(totalByCc[cc], 'total_other_c'),
					});
				}
			} else if (currentInfoTab === 'inkind') {
				paymentTableData = App.getInkindSupportProjects(allPayments, 'r', recIso);
			}

			// clear DataTables plugin from table
			if (infoTableHasBeenInit) infoDataTable.destroy();

			// populate table
			const infoTable = content.select('.funds-table');
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

			const cells = newRows.merge(rows).selectAll('td')
				.data(d => headerData.map(c => ({ rowData: d, colData: c })));
			cells.exit().remove();
			cells.enter().append('td')
				.merge(cells)
				.classed('money-cell', d => d.colData.type === 'money')
				.classed('inkind-cell', d => d.colData.supportType === 'inkind')
				.html(function(d){
					let cellValue = '';
					if (d.colData.valueFunc) {
						cellValue = d.colData.valueFunc(d.rowData);
					} else if (typeof d.colData.value === 'function') {
						cellValue = d.colData.value(d.rowData);
					} else {
						cellValue = d.rowData[d.colData.value];
					}
					if (cellValue === 'Specific amount unknown') {
						d3.select(this).attr('data-sort', -1000);
						return cellValue;
					}
					if (d.colData.type === 'money') {
						d3.select(this).attr('data-sort', App.formatMoneyFull(cellValue));
						return App.formatMoneyFull(cellValue);
					}
					if (d.colData.supportType === 'inkind') {
						d3.select(this).attr('data-sort', cellValue);
						return Util.comma(cellValue);
					}
					return cellValue;
				});

			// define DataTables plugin parameters
			let order = [];
			let columnDefs = [];
			if (currentInfoTab === 'all') {
				order = [4, 'desc'];
				columnDefs = [{ type: 'money', targets: [3, 4], width: '120px' }];
			} else if (currentInfoTab === 'cc') {
				order = [2, 'desc'];
				columnDefs = [{ type: 'money', targets: [1, 2, 3], width: '120px' }];
			} else if (currentInfoTab === 'inkind') {
				order = [1, 'desc'];
				columnDefs = [{ targets: [2], width: '450px' }];
			}

			// re-initialize DataTables plugin
			infoDataTable = $content.find('.funds-table').DataTable({
				scrollY: '30vh',
				scrollCollapse: true,
				deferRender: true,
				order,
				columnDefs,
			});
			infoTableHasBeenInit = true;

			// Tooltip for General IHR Implementation
				$content.find('.funds-table').find('.general-ihr-info-img').tooltipster({
					interactive: true,
					content: App.generalIhrText,
				});
		}

		init();
	};
})();
