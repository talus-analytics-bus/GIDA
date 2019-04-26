(() => {
	let data;

	App.initData = () => {
		// data = [App.fundingData[0]] // DEBUG
		data = App.fundingData
		.map(d => [
			(d.project_name || 'Not Reported').toString(),
			(d.donor_name || 'Not Reported').toString(),
			(d.recipient_name || 'Not Reported').toString(),
		]);


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
				return [
					{
						name: 'project_name',
						func: false,
						noDataText: 'Unspecified',
					},
					{
						name: 'project_description',
						func: true,
						noDataText: 'Unspecified',
					},
					{
						name: 'assistance_type',
						func: false,
						noDataText: 'Unspecified',
					},
					{
						name: 'donor_name',
						func: false,
						noDataText: 'Unspecified',
					},
					{
						name: 'donor_sector',
						func: false,
						noDataText: 'Unspecified',
					},
					{
						name: 'donor_code',
						func: true,
						noDataText: 'Unspecified',
						params: { codeToNameMap: App.codeToNameMap },
					},
					{
						name: 'recipient_name',
						func: false,
						noDataText: 'Unspecified',
					},
					{
						name: 'recipient_sector',
						func: true,
						noDataText: 'Unspecified',
					},
					{
						name: 'recipient_country',
						func: true,
						noDataText: 'Unspecified',
						params: { codeToNameMap: App.codeToNameMap },
					},
					{
						name: 'core_capacities',
						func: true,
						noDataText: 'None identified',
						params: { capacitiesDict: _.indexBy(App.capacities, 'id') },
					},
					{
						name: 'total_committed',
						func: false,
						noDataText: 'Unspecified', // note: n/a if in-kind
					},
					{
						name: 'total_spent',
						func: false,
						noDataText: 'Unspecified', // note: n/a if in-kind
					},
					{
						name: 'year_range',
						func: false,
						noDataText: 'Unspecified',
						// func: true, // calc from transactions
						// params: { dataEndYear: App.dataEndYear }
					},
					{
						name: 'source',
						func: true, // maybe format with date, etc.?
						noDataText: 'Unspecified',
					},
					{
						name: 'currency',
						func: true,
						noDataText: 'Unspecified',
						params: { currencyIso: App.currencyIso },
					},
				];
			};
			const getExportData = () => { return _.sortBy(App.fundingData, d => +d.year_range.split(' - ')[0] ).reverse(); }; // TODO
			downloadData(
				{
					exportCols: getExportCols(),
					exportData: getExportData(),
				}
			);
		});

		populateTable();

		$('.filter-contents').hide();
		$('.filter-header').on('click', () => {
			$('.filter-contents').slideToggle();
			$('.filter-glyph').toggleClass('flip');
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
			console.log('blobTmp')
			console.log(blobTmp)
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
				if (callback) callback(null);
				return;
			} catch (err) {
				console.log(err);
			}
		});
	};

	const download = (filename, text) => {
		// https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);

		element.style.display = 'none';
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	};

	const populateTable = () => {
		$('table.download-data-table').DataTable({
			data,
			columns: [
				{ title: 'Project&nbsp;&nbsp;', width: '60%' },
				{ title: '<img style="width:25px;" src="/img/logo-tableFunder.svg" alt="">&nbsp;&nbsp;Funder&nbsp;&nbsp;', width: '20%' },
				{ title: '<img style="width:25px;" src="/img/logo-tableRecipient.svg" alt="">&nbsp;&nbsp;Recipient&nbsp;&nbsp;', width: '20%' },
			],
			pageLength: 25,
			scrollCollapse: false,
			autoWidth: false,
			ordering: true,
			searching: true,
			// pagingType: 'simple',
			// order: [[1, 'asc']],
			// columnDefs: [
			// 	{ targets: [1,2,3], orderable: false},
			// ],
			bLengthChange: false,
		});
	}
})();
