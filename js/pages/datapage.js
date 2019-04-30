(() => {

	let data; // data to be exported
	let table; // jQuery DataTable handle

	/**
	 * Initialize the "Data" page content.
	 */
	App.initData = () => {
		const exportColFuncs = {
			project_description: function (datum, col) {
				if (datum.source.name !== 'IATI via D-Portal') {
					if (unspecifiedValues.includes(datum[col.name])) return null;
					else return datum[col.name];
				} else return 'n/a (descriptions not available for IATI projects)';
			},
			core_capacities: function (datum, col) {
				const colData = datum[col.name].filter(d => d !== '');
				if (colData && colData.length > 0) {
					return colData.map(id => {
						if (id === 'POE') return col.params.capacitiesDict['PoE'];
						else return col.params.capacitiesDict[id].name
					}).join(';\n');
				} else return null;
			},
			donor_code: function (datum, col) {
				const colData = datum[col.name];
				if (!unspecifiedValues.includes(colData)) {
					if (datum.donor_sector === 'Government') {
						return col.params.codeToNameMap['$' + colData];
					} else return 'n/a';
				} else return null;
			},
			recipient_sector: function (datum, col) {
				const colData = datum[col.name];
				if (!unspecifiedValues.includes(colData)) {
					if (colData === 'Country') {
						return 'Government';
					} else return colData;
				} else return null;
			},
			recipient_country: function (datum, col) {
				const colData = datum[col.name];
				if (!unspecifiedValues.includes(colData)) {
					if (datum.recipient_sector === 'Country') {
						return col.params.codeToNameMap['$' + colData];
					} else return 'n/a';
				} else return null;
			},
			source: function (datum, col) {
				const colData = datum[col.name];
				if (!unspecifiedValues.includes(colData)) {
					return colData.name;
				} else return null;
			},
			currency: function (datum, col) {
				if (datum.assistance_type && datum.assistance_type === 'In-kind support') {
					return 'n/a';
				}
				if (datum.total_spent !== undefined || datum.total_committed !== undefined) {
					return col.params.currencyIso;
				} else return null;
			},
			year_range: function (datum, col) {
				const t = datum.transactions;
				if (t.length > 0) {
					const min = Math.min(...t.map(tt => {
						if (tt.cy === '') return Infinity;
						if (+tt.cy > +col.params.dataEndYear) {
							return Infinity;
						} else return +tt.cy;
					}
				)
			);
			const max = Math.max(...t.map(tt => {
				if (tt.cy === '') return -Infinity;
				if (+tt.cy > +col.params.dataEndYear) {
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

// data = [App.fundingData[0]] // DEV
data = App.fundingData;

var downloadImg = document.createElement("img");
downloadImg.src = '/img/logo-download-light.svg';
var downloadBtn = document.getElementsByClassName('download-container');
$('.download-container').html(`<span class="glyphicon glyphicon-download-alt"></span>&nbsp;&nbsp;Download all available data (${Util.comma(data.length)} records)`)
.on('click', () => {
	/**
	* Return columns to be included in data export (name and processing func.)
	* @return {array} Columns to be included in export
	*/
	const getExportCols = () => {
		return defaultExportCols;
	};
	const getExportData = () => { return _.sortBy(App.fundingData, d => +d.year_range.split(' - ')[0] ).reverse(); }; // TODO
	downloadData(
		{
			exportCols: getExportCols(),
			exportData: getExportData(),
		}
	);
});

populateFieldCheckboxes(defaultExportCols);
populateFilters();

table = initTable();
function updateTable (dataToShow) {
	const enabledCols = ['project_name:name'];
	$('.field-options input:checked').each((d, i) => enabledCols.push($(i).val() + ':name'));

	table.columns().visible(false)
		.columns(enabledCols).visible(true);

	if (dataToShow !== undefined) {
		table
		.clear()
		.rows.add(dataToShow);
	}
	table.draw();
}
table.update = updateTable;
// table.update(App.fundingData)
table.update(_.sample(App.fundingData, 100))

$('.select-data-contents').hide();
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
	},
	{
		name: 'source', // always export
		func: true, // maybe format with date, etc.?
		noDataText: 'Unspecified',
		showByDefault: true,
		hasCheckbox: true,
		displayName: 'Data source',
		render: (d) => d.name,
	},
	{
		name: 'core_capacities',
		func: true,
		noDataText: 'None identified',
		params: { capacitiesDict: _.indexBy(App.capacities, 'id') },
		showByDefault: true,
		displayName: 'Core Capacities',
		hasCheckbox: true,
	},
	{
		name: 'year_range',
		func: false,
		noDataText: 'Unspecified',
		showByDefault: true,
		displayName: 'Project year range', // should have info tooltip probably
		hasCheckbox: true,
		// func: true, // calc from transactions
		// params: { dataEndYear: App.dataEndYear }
	},
	{
		name: 'donor_name',
		func: false,
		noDataText: 'Unspecified',
		showByDefault: true,
		displayName: 'Funder',
		hasCheckbox: true,
		title: '<img style="width:25px;" src="/img/logo-tableFunder.svg" alt="">&nbsp;&nbsp;Funder&nbsp;&nbsp;',
	},
	{
		name: 'recipient_name',
		func: false,
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
		displayName: 'Assistance type',
		hasCheckbox: true,
	},
	{
		name: 'total_committed',
		func: false,
		noDataText: 'Unspecified', // note: n/a if in-kind
		showByDefault: true,
		displayName: 'Amount committed',
		hasCheckbox: true,
	},
	{
		name: 'total_spent',
		func: false,
		noDataText: 'Unspecified', // note: n/a if in-kind
		showByDefault: true,
		displayName: 'Amount disbursed',
		hasCheckbox: true,
	},
	{
		name: 'donor_sector',
		func: false,
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

/**
 * Initialize the jQuery DataTable on this page that lists project data.
 * @return {Object} jQuery DataTable
 */
function initTable(){
	// define Columns
	const cols = [];
	defaultExportCols.forEach(colDatum => {
		if (colDatum.displayName === undefined) return;
		const colObj = {
			...colDatum,
			visible: false,
			data: colDatum.name,
		};
		if (colObj.title === undefined) colObj.title = colObj.displayName;
		cols.push(colObj);
	});
	// const cols = [
	// 	{ title: 'Project&nbsp;&nbsp;', name: 'project_name', data: 'project_name', width: '60%' },
	// 	{ title: '<img style="width:25px;" src="/img/logo-tableFunder.svg" alt="">&nbsp;&nbsp;Funder&nbsp;&nbsp;', name:'donor_name', data: 'donor_name', width: '20%' },
	// 	{ title: '<img style="width:25px;" src="/img/logo-tableRecipient.svg" alt="">&nbsp;&nbsp;Recipient&nbsp;&nbsp;', data: 'recipient_name', width: '20%' },
	// ];
	// cols.forEach((col) => col.visible = false);

	// activate Datatable
	console.log('cols')
	console.log(cols)
	return $('table.download-data-table').DataTable( {
		data: App.fundingData,
		scrollCollapse: false,
		autoWidth: true,
		ordering: true,
		scrollX: true,
		// sScrollXInner: "100%",
		order: [[4, 'desc']],
		searching: true,
		pageLength: 25,
		bLengthChange: false,
		columns: cols,
	} );
	// return stateTable;
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

	$('.field-options input').change(function () {
		console.log($(this).val());
		table.update(); // TODO
	});
};

/**
 * Populate and turn on functionality for filters.
 */
const populateFilters = () => {
	// Core Capacities
	App.populateCcDropdown('.cc-select', { dropUp: false, dropLeft: true, selected: false, });
};

})();
