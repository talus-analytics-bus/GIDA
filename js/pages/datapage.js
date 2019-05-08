(() => {

	let data; // data
	let filteredData; // data to be exported
	let table; // jQuery DataTable handle

	/**
	* Initialize the "Data" page content.
	*/
	App.initData = () => {

		// Information about columns shown in the DataTable.
		const defaultExportCols = [
			{
				name: 'project_name',
				func: false,
				noDataText: 'Unspecified',
				showByDefault: true, // show in table
				displayName: "Project name", // check the checkbox
				hasCheckbox: false, // don't show a checkbox
			},
			{
				name: 'project_description',
				noDataText: 'Unspecified',
				func: true,
				displayName: 'Project description', // name of checkbox
				showByDefault: true,
				hasCheckbox: true,
				width: '350px',
			},
			{
				name: 'source', // always export
				func: true, // maybe format with date, etc.?
				noDataText: 'Unspecified',
				showByDefault: true,
				hasCheckbox: true,
				displayName: 'Data source',
			},
			{
				name: 'core_capacities',
				func: true,
				noDataText: 'None identified',
				params: { capacitiesDict: _.indexBy(App.capacities, 'id') },
				showByDefault: true,
				displayName: 'Core capacities',
				hasCheckbox: true,
			},
			{
				name: 'year_range',
				func: false,
				noDataText: 'Unspecified',
				showByDefault: true,
				displayName: 'Transaction year range', // should have info tooltip probably
				hasCheckbox: true,
				// func: true, // calc from transactions
				// params: { dataEndYear: App.dataEndYear }
			},
			{
				name: 'donor_name',
				func: true,
				noDataText: 'Unspecified',
				showByDefault: true,
				displayName: 'Funder',
				hasCheckbox: true,
				title: '<img style="width:25px;" src="/img/logo-tableFunder.svg" alt="">&nbsp;&nbsp;Funder&nbsp;&nbsp;',
			},
			{
				name: 'recipient_name',
				func: true,
				noDataText: 'Unspecified',
				showByDefault: true,
				displayName: 'Recipient',
				hasCheckbox: true,
				title: '<img style="width:25px;" src="/img/logo-tableRecipient.svg" alt="">&nbsp;&nbsp;Recipient&nbsp;&nbsp;',
			},
			{
				name: 'assistance_type',
				func: false,
				noDataText: 'Unspecified',
				showByDefault: true,
				displayName: 'Support type',
				hasCheckbox: true,
			},
			{
				name: 'total_committed',
				func: false,
				noDataText: 'Unspecified', // note: n/a if in-kind
				showByDefault: true,
				displayName: `Amount committed (${App.dataStartYear} - ${App.dataEndYear})`,
				hasCheckbox: true,
				className: 'nowrap',
			},
			{
				name: 'total_spent',
				func: false,
				noDataText: 'Unspecified', // note: n/a if in-kind
				showByDefault: true,
				displayName: `Amount disbursed (${App.dataStartYear} - ${App.dataEndYear})`,
				hasCheckbox: true,
				className: 'nowrap',
			},
			{
				name: 'donor_sector',
				func: true,
				noDataText: 'Unspecified',
				hasCheckbox: false,
			},
			{
				name: 'donor_code',
				func: true,
				noDataText: 'Unspecified',
				params: { codeToNameMap: App.codeToNameMap },
				hasCheckbox: false,
			},

			{
				name: 'recipient_sector',
				func: true,
				noDataText: 'Unspecified',
				hasCheckbox: false,
			},
			{
				name: 'recipient_country',
				func: true,
				noDataText: 'Unspecified',
				params: { codeToNameMap: App.codeToNameMap },
				hasCheckbox: false,
			},
			{
				name: 'currency', // always export if $$$ exported
				func: true,
				noDataText: 'Unspecified',
				showByDefault: false,
				hasCheckbox: false,
				params: { currencyIso: App.currencyIso },
			},
		];

		// data = [App.fundingData[0]] // DEV
		data = Util.uniqueCollection(App.fundingDataFull, 'project_id');

		var downloadImg = document.createElement("img");
		downloadImg.src = '/img/logo-download-light.svg';
		var downloadBtn = document.getElementsByClassName('download-container');
		$('.download-container').html(`<span class="glyphicon glyphicon-download-alt"></span>&nbsp;&nbsp;Download all available data (${Util.comma(data.length)} records)`)
		.on('click', () => {
			/**
			* Return columns to be included in data export (name and processing func.)
			* @return {array} Columns to be included in export
			*/
			const getExportCols = (defaultExportCols) => {
				let names = d3.selectAll('.field-options input:checked').data().map(d => d.name);
				if (names.includes('donor_name')) {
					names = names.concat(['donor_sector', 'donor_code']);
				}
				if (names.includes('recipient_name')) {
					names = names.concat(['recipient_sector', 'recipient_country']);
				}
				if (names.includes('total_committed') || names.includes('total_spent')) {
					names.push('currency');
				}
				names.push('project_name');

				const exportCols = defaultExportCols.filter(d => names.includes(d.name));
				return exportCols;
			};

			/**
			* Return list of column names to hide in export XLSX file.
			* @return {array} Column names to hide (Strings)
			*/
			const getHideCols = () => {
				let names = d3.selectAll('.field-options input:not(:checked)').data().map(d => d.name);
				if (names.includes('donor_name')) {
					names = names.concat(['donor_sector', 'donor_code']);
				}
				if (names.includes('recipient_name')) {
					names = names.concat(['recipient_sector', 'recipient_country']);
				}
				if (names.includes('total_committed') && names.includes('total_spent')) {
					names.push('currency');
				}
				const hideCols = names;
				return hideCols;
			}
			const getExportData = () => {
				if (filteredData === undefined) filteredData = data;
				return _.sortBy(filteredData, d => +d.year_range.split(' - ')[0] ).reverse();
			};

			// Download the filtered data including only the selected data fields (columns).
			downloadData(
				{
					exportCols: getExportCols(defaultExportCols),
					hideCols: getHideCols(),
					exportData: getExportData(),
				}
			);
		});

		populateFieldCheckboxes(defaultExportCols);
		populateFilters();

		table = initTable(defaultExportCols);
		function updateTable (dataToShow) {
			NProgress.start();
			const enabledCols = ['project_name:name'];
			$('.field-options input:checked').each((d, i) => enabledCols.push($(i).val() + ':name'));

			table.columns().visible(false)
			.columns(enabledCols).visible(true);

			if (dataToShow !== undefined) {
				table
				.clear()
				// .fnAddData(dataToShow,false);
				.rows.add(dataToShow);
			}
			table.draw();
			NProgress.done();
		}
		table.update = updateTable;
		const updateData = data;
		table.update(updateData)

		$('.select-data-contents').show();
		$('.select-data-glyph').addClass('flip');
		$('.select-data-header').on('click', () => {
			$('.select-data-contents').slideToggle();
			$('.select-data-glyph').toggleClass('flip');
		});
	};

	/**
	* Download data in format of pretty XLSX file.
	* @param  {Object} [params={}] Parameters
	*/
	const downloadData = (params = {}) => {
		NProgress.start();
		fetch('/download_data', {
			method: 'POST',
			body: JSON.stringify(
				{
					params: params,
				},
			),
			headers: {
				"Content-Type": "application/json",
			},
		}).then((result) => {
			return Promise.resolve(result.blob());
		}).then((blobTmp) => {
			NProgress.done();
			try {
				const blob = new Blob([blobTmp], {type: 'application/vnd.ms-excel'});
				const downloadUrl = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = downloadUrl;

				// set file name
				const today = new Date();
				const year = today.getFullYear();
				let month = String(today.getMonth() + 1);
				if (month.length === 1) month = `0${month}`;
				let day = String(today.getDate());
				if (day.length === 1) day = `0${day}`;
				const yyyymmdd = `${year}${month}${day}`;
				const filenameStr = yyyymmdd;
				const fn = 'GIDA - Data Export ';
				a.download = fn + filenameStr + ".xlsx";
				document.body.appendChild(a);
				a.click();
				return;
			} catch (err) {
				console.log(err);
			}
		});
	};

	/**
	* Initialize the jQuery DataTable on this page that lists project data.
	* @return {Object} jQuery DataTable
	*/
	function initTable(defaultExportCols){

		// Functions used to format values for each column
		const unspecifiedValues = [null, undefined, ''];
		const moneyFunc = function (datum, type, row) {
			if (!row.assistance_type.includes('financial')) return '-';
			if (row.within_data_years === false) return App.outsideYearRangeText;
			if (!unspecifiedValues.includes(datum)) {
				return App.formatMoneyFull(datum);
			} else return '-';
		};
		const exportColFuncs = {
			project_description: function (datum, type, row) {
				if (row.source.name !== 'IATI via D-Portal') {
					if (unspecifiedValues.includes(datum)) return null;
					else return datum;
				} else return 'n/a (descriptions not available for IATI projects)';
			},
			total_committed: moneyFunc,
			total_spent: moneyFunc,
			recipient_name: function (datum, type, row) {
				if (row.recipient_name_orig !== undefined) return row.recipient_name_orig;
				if (!unspecifiedValues.includes(datum)) return datum;
				else return null;
			},
			donor_name: function (datum, type, row) {
				if (row.donor_name_orig !== undefined) return row.donor_name_orig;
				if (!unspecifiedValues.includes(datum)) return datum;
				else return null;
			},
			core_capacities: function (datum, type, row) {
				const colData = row.core_capacities.filter(d => d !== '');
				if (colData && colData.length > 0) {
					const capacitiesDict = _.indexBy(App.capacities, 'id');
					return colData.map(id => {
						if (id === 'POE') return capacitiesDict['PoE'].name;
						else return capacitiesDict[id].name
					}).join(';\n');
				} else return null;
			},
			donor_code: function (datum, type, row) {
				if (!unspecifiedValues.includes(datum)) {
					if (row.donor_sector === 'Government') {
						return App.codeToNameMap.get(datum);
					} else return 'n/a';
				} else return null;
			},
			recipient_sector: function (datum, type, row) {
				if (!unspecifiedValues.includes(datum)) {
					if (datum === 'Country') {
						return 'Government';
					} else return datum;
				} else return null;
			},
			recipient_country: function (datum, type, row) {
				if (!unspecifiedValues.includes(datum)) {
					if (row.recipient_sector === 'Country' || row.recipient_sector === 'Government') {
						return App.codeToNameMap.get(datum);
					} else return 'n/a';
				} else return null;
			},
			source: function (datum, type, row) {
				if (!unspecifiedValues.includes(datum.name)) {
					return datum.name;
				} else return null;
			},
			currency: function (datum, type, row) {
				if (row.assistance_type && row.assistance_type === 'In-kind support') {
					return 'n/a';
				}
				if (row.total_spent !== undefined || row.total_committed !== undefined) {
					return App.currencyIso;
				} else return null;
			},
			year_range: function (datum, type, row) {
				if (datum === '') return null;
				if (datum !== undefined) return datum;
				else return null;

				const t = row.transactions;
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
	if (min === Infinity || max === -Infinity) return null;
	if (min === max) return min;
	else return `${min} - ${max}`;
} else return null;
},
};

// define columns to show in data table (some are hidden)
const cols = [];
defaultExportCols.forEach(colDatum => {
	if (colDatum.displayName === undefined) return;

	// functions for formatting values
	const colObj = {
		...colDatum,
		visible: false,
		data: colDatum.name,
		defaultContent: colDatum.noDataText,
		render: {
			'display': exportColFuncs[colDatum.name] || ((d) => d),
		},
	};
	if (colObj.title === undefined) colObj.title = colObj.displayName;
	cols.push(colObj);
});

// activate Datatable
return $('table.download-data-table').DataTable( {
	data: [],
	deferRender: true,
	scrollCollapse: false,
	autoWidth: true,
	ordering: true,
	scrollX: true,
	scrollY: "400px",
	order: [[4, 'desc']],
	searching: true,
	pageLength: 25,
	bLengthChange: false,
	columns: cols,
} );
}

/**
* Populate and turn on callbacks for checkboxes in data field selection area.
* @param  {array} cols Columns data to check for checkbox data.
*/
const populateFieldCheckboxes = (cols) => {
	const labels = d3.select('.field-options').append('form').selectAll('input')
	.data(cols.filter(d => d.hasCheckbox === true), d => d.name)
	.enter().append('label')
	.attr('class','checkbox');
	labels.append('span')
	.text(d => d.displayName);
	labels.append('input')
	.attr('name','fields')
	.attr('type','checkbox')
	.attr('value', d => d.name)
	.property('checked', d => d.showByDefault === true);

	// Callback: Update visible cols in table when checkboxes changed
	$('.field-options input').change(function () {
		table.update();
	});
};

/**
* Populate and turn on functionality for filters.
*/
const populateFilters = () => {
	const getButtonTextFunc = (title, nMax) => {
		return function(options, select) {
			if (options.length === 0 || options.length === nMax) {
				return `${title} (all)`;
			}
			return `${title} (${options.length} of ${nMax})`;

		}
	};
	const filterCallback = () => {
		// get ccs
		const ccs = $('.cc-select').val();
		ccs.key = 'core_capacities';
		let someFilters = false;
		if (ccs.length > 0) someFilters = true;
		const filters = [ccs];

		// get other filters
		$('.other-select').each(function(){
			const select = $(this);
			const vals = select.val();
			vals.key = select.attr('key');
			if (vals.length > 0) someFilters = true;
			filters.push(vals);
		})


		// do filtering (update data)
		filteredData = data.filter(p => {
			let match = true;
			filters.forEach(filterSet => {
				let pVals = p[filterSet.key];
				if (typeof pVals !== 'object') pVals = [pVals];
				if (!App.passesCategoryFilter(pVals, filterSet)) match = false;
			});
			return match;
		});

		// update table
		table.update(filteredData);

		// update filters enabled

		// update download button
		const type = someFilters ? 'selected' : 'all available';
		$('.download-container').html(`<span class="glyphicon glyphicon-download-alt"></span>&nbsp;&nbsp;Download ${type} data (${Util.comma(filteredData.length)} records)`)

		// show/hide clear filters
		$('.clear-filter-btn').css('visibility', someFilters ? 'visible' : 'hidden');
	};
	const clearFiltersCallback = () => {
		// clear all filters
		$('.cc-select, .other-select').multiselect('deselectAll', false);
		$('.cc-select, .other-select').multiselect('updateButtonText');
		$('.clear-filter-btn').css('visibility', 'hidden');
		filterCallback();
	};
	$('.clear-filter-btn').click(clearFiltersCallback);

	// Core Capacities
	App.populateCcDropdown('.cc-select',
	{
		dropUp: false,
		dropLeft: true,
		selected: false,
		multiselectParam: {
			buttonText: getButtonTextFunc('Funding by core capacity', App.capacities.length + 1),
			enableFiltering: true,
			enableCaseInsensitiveFiltering: true,
			onChange: filterCallback,
			onSelectAll: filterCallback,
		}
	});

	// Other filter selections
	d3.selectAll('.filter-options .other-select').each(function () {
		const select = d3.select(this);
		const key = select.attr('key');
		const selector = `select[key="${key}"]`;
		const valKey = 'val';
		const nameKey = 'name';
		const title = select.attr('title');
		const items = Util.unique(App.fundingDataFull, key).filter(d => d).sort().map(d => {
			return {
				name: d,
				val: d,
			}
		});
		App.populateOtherDropdown(selector, items, valKey, nameKey,
			{
				dropUp: false,
				dropLeft: true,
				selected: false,
				multiselectParam: {
					buttonText: getButtonTextFunc(title, items.length),
					enableFiltering: true,
					enableCaseInsensitiveFiltering: true,
					onChange: filterCallback,
					onSelectAll: filterCallback,
				}
			});
		});
	};

})();
