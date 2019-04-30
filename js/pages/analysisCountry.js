(() => {
	App.initAnalysisCountry = (iso, moneyType) => {

		if (!moneyType) initBasicProfile();

		// Is this the GHSA page? It has several special features.
		const isGhsaPage = iso === 'ghsa';

		// Is this a page for a country with a JEE score set available?
		const showJee = App.scoresByCountry[iso] !== undefined && moneyType === 'r';

		// define "country" parameters for General Global Benefit recipient
		const ggb = {
			"FIPS": "ggb",
			"ISO2": "ggb",
			"ISO3": "ggb",
			"NAME": "General Global Benefit",
			"regionName": "General Global Benefit",
			"subRegionName": "General Global Benefit",
			"intermediateRegionName": "General Global Benefit"
		};

		// get country information
		App.loadFundingData({showGhsaOnly: App.showGhsaOnly});
		const country = (iso === "General Global Benefit") ? ggb : App.countries.find(c => c.ISO2 === iso);
		let lookup = (moneyType === 'd') ? App.fundingLookup : App.recipientLookup;
		const color = (moneyType === 'd') ? App.fundColor : App.receiveColor;
		const middleColor = (moneyType === 'd') ? App.fundColorPalette[4] : App.receiveColorPalette[4];
		const lightColor = (moneyType === 'd') ? App.fundColorPalette[2] : App.receiveColorPalette[2];

		if (iso === "General Global Benefit") {
			$('.toggle-type').css('visibility', 'hidden');
		} else {
			$('.toggle-type').css('visibility', '');
		}

		// initializes the whole page
		function init() {
			App.setSources();
			// fill title
			const name = App.codeToNameMap.get(iso);
			const flagHtml = country ? App.getFlagHtml(iso) : '';


			$('.analysis-country-flagAndName')
				.html(`${flagHtml}${name} `);
			// .on('click', () => hasher.setHash(`analysis/${iso}`));

			const countryTitleDiv = d3.select('.profile')
				.style('background-color', color);
			//countryTitleDiv.append('br');
			countryTitleDiv.append('div')
				.attr('class', 'profile-type-container')
				.append('div')
				.attr('class', 'profile-type-text')
				.append('span')
				.attr('class', 'money-type-noun-cap-profile');


			$('.return-button').on('click', () => hasher.setHash('/'));

			// fill out generic text
			$('.country-name').text(name);
			$('.start-year').text(App.dataStartYear);
			$('.end-year').text(App.dataEndYear);
			$('.money-type').text('disbursed');
			// $('.money-type').text(moneyType === 'd' ? 'disbursed' : 'committed');
			$('.provided-or-received').text(moneyType === 'd' ? 'provided' : 'received');
			$('.money-type-cap').text(moneyType === 'd' ? 'Disbursed' : 'Received');
			$('.money-type-noun').text(moneyType === 'd' ? 'funder' : 'recipient');
			$('.money-type-noun-cap').text(moneyType === 'd' ? 'Funder' : 'Recipient');
			$('.money-type-noun-cap-profile').text(moneyType === 'd' ? 'FUNDER PROFILE' : 'RECIPIENT PROFILE');
			$('.opp-money-type-noun').text(moneyType === 'd' ? 'recipient' : 'funder');
			$('.opp-inkind-type-noun').text(moneyType === 'd' ? 'recipient' : 'provider');
			$('.opp-money-type-verb').text(moneyType === 'd' ? 'received' : 'donated');

			if (moneyType) initDonorOrRecipientProfile();
			else initBasicProfile();

			toggleGhsaContent(isGhsaPage);
			initGhsaToggle();

			// Tooltip for General IHR Implementation
			$('.general-ihr-info-img').tooltipster({
				interactive: true,
				content: App.generalIhrText,
			});

			// Set toggle for type of page
			let toggleState;
			if (moneyType === 'r') {
				toggleState = 'received';
			} else {
				toggleState = 'funded';
			}
			App.newToggle(
				'.switch-type-button',
				{
					default: toggleState
				},
				() => hasher.setHash(`analysis/${iso}/d`),
				() => hasher.setHash(`analysis/${iso}/r`),
			);
		}

		$('.ghsaBut').click(function () {
			hasher.setHash('analysis/ghsa/d');
		});

		/**
		 * If the page shown is a recipient country with published JEE scores, they will be visible in
		 * the core capacity bar chart, and need a legend to define them.
		 */
		function addJeeScoreLegendBox() {
			// Show the legend box (hidden by default)
			const $legendBox = d3.select('.legend-box.category-chart-legend-box');
			$legendBox.style('display', 'block');

			// Data for legend box content
			const row1 = [
				{
					title: `4 and above`,
					color: App.jeeColors[5],
				},
				{
					title: `Below 2`,
					color: App.jeeColors[0],
				}
			];
			const row2 = [
				{
					title: `2 and above, below 4`,
					color: d3.color(App.jeeColors[1]).darker(.5),
				},
				{
					title: `No score`,
					color: 'gray',
				}
			];
			const legendEntries = [row1, row2];

			// Add the content of the legend box
			legendEntries.forEach(row => {
				// Add a row to the legend box
				const $row = $legendBox.select('.legend-content')
					.append('div')
					.attr('class', 'legend-col');
				row.forEach(entry => {
					// add an entry to the row
					const $entry = $row.append('div')
						.datum(entry)
						.attr('class', 'legend-entry');
					// add a circle to the entry
					const circleYShift = 1;
					$entry.append('svg')
						.attr('width', 10)
						.attr('height', 10)
						.append('circle')
						.style('fill', d => d.color)
						.attr('r', 3)
						.attr('cx', 5)
						.attr('cy', 5 + circleYShift);
					// add a label to entry
					$entry.append('span')
						.text(d => d.title);
				});
			});
		}

		/**
		 * If the page is 'GHSA', then hide several page elements that aren't rational for this view.
		 * @param  {Boolean} isGhsaPage    Whether this page is the 'ghsa' page or not.
		 *                                   A constant set on initiation.
		 */
		function toggleGhsaContent(isGhsaPage) {
			if (isGhsaPage) {
				//$(`.ghsa-toggle-options, .switch-type-button, .profile-type-container, #GHSAButton, .analysis-country-title > br`)
				$(`.ghsa-toggle-options, .switch-type-button, .profile-type-container, .analysis-country-title > br, #GHSAButton`)
					.remove();
				// .css('visibility','hidden');
				$('.analysis-country-title').addClass('ghsa');

				d3.select('.analysis-country-title.ghsa').select('img').remove();
				d3.select('.analysis-country-flagAndName').append('img')
					.attr('class', 'ghsa-info-img info-img')
					.attr('src', 'img/info.png');

				// init tooltip
				$('.ghsa-info-img').tooltipster({
					interactive: true,
					content: App.ghsaInfoTooltipContent,
				});

			} else {
				$('.second-country-table-section').remove();
			}
		}

		function initGhsaToggle() {
			// set GHSA radio button to checked if that is set
			if (App.showGhsaOnly) {
				$(`.ghsa-toggle-options input[type=radio][name="ind-country"][ind="ghsa"]`).prop('checked', true);
				$('.ghsa-only-text').text('GHSA-specific ')
			}

			$('.analysis-country-content .ghsa-toggle-options .ind-type-filter .radio-option').off('click');
			$('.analysis-country-content .ghsa-toggle-options .ind-type-filter .radio-option').click(function updateIndType() {
				// Load correct funding data
				indType = $(this).find('input').attr('ind');
				App.showGhsaOnly = indType === 'ghsa';

				// Reload profile graphics and data
				crossroads.parse(hasher.getHash());
			});

			// init tooltip
			$('.ghsa-info-img').tooltipster({
				interactive: true,
				content: App.ghsaInfoTooltipContent,
			});
		}

		function initBasicProfile(params = {}) {
			// calculate total funded and received
			const totalFunded = App.getTotalFunded(iso, {includeCommitments: true});
			const totalReceived = App.getTotalReceived(iso, {includeCommitments: true});

			if (totalFunded > totalReceived) {
				hasher.setHash(`analysis/${iso}/d`);
				return;
			}
			else {
				hasher.setHash(`analysis/${iso}/r`);
				return;
			}

			// fill details
			$('.country-region').text(country.regionName);
			$('.country-subregion').text(country.subRegionName);
			if (country.intermediateRegionName) {
				$('.country-intermediate').text(country.intermediateRegionName);
			} else {
				$('.country-intermediate').closest('.country-details-row').hide();
			}

			if (iso !== "General Global Benefit")
				$('.country-population').text(d3.format(',')(country.POP2005));

			// fill summary values
			$('.country-funded-value').html(App.formatMoneyFormatted(totalFunded));
			$('.country-received-value').html(App.formatMoneyFormatted(totalReceived));

			// button behavior for getting to donor and recipient profile
			$('.show-donor-btn').click(() => hasher.setHash(`analysis/${iso}/d`));
			$('.show-recipient-btn').click(() => hasher.setHash(`analysis/${iso}/r`));

			// draw charts
			let maxFunded = 0;
			let maxReceived = 0;
			for (const fIso in App.fundingLookup) {
				if (fIso !== 'Not reported') {
					const sum = d3.sum(App.fundingLookup[fIso], d => d.total_spent);
					if (sum > maxFunded) maxFunded = sum;
				}
			}
			for (const rIso in App.recipientLookup) {
				if (rIso !== 'Not reported') {
					const sum = d3.sum(App.recipientLookup[rIso], d => d.total_spent);
					if (sum > maxReceived) maxReceived = sum;
				}
			}
			const relPercFunded = totalFunded / maxFunded;
			const relPercReceived = totalReceived / maxReceived;
			App.drawValueSquares('.donor-squares', relPercFunded, App.fundColor, {
				right: true,
			});
			App.drawValueSquares('.recipient-squares', relPercReceived, App.receiveColor);

			// display content
			$('.country-summary-content').slideDown();
		}

		function initDonorOrRecipientProfile() {
			// initialize "go to table" button
			$('.show-table-btn').click(() => {
				hasher.setHash(`analysis/${iso}/${moneyType}/table`);
			});

			// fill out funder/recipient text
			let hasNoData = false;
			const totalFunded = App.getTotalFunded(iso);
			const totalFundedCommitted = App.getTotalFunded(iso, {committedOnly: true});
			const totalReceived = App.getTotalReceived(iso);
			const totalReceivedCommitted = App.getTotalReceived(iso, {committedOnly: true});

			const projectsIncludingGroups = App.getProjectsIncludingGroups(App.fundingData, moneyType, iso);
			lookup[iso] = projectsIncludingGroups; // TODO check if this breaks things

			if (moneyType === 'd') {
				hasNoData = projectsIncludingGroups === undefined || projectsIncludingGroups.length === 0;

				// fill out "switch profile" text and behavior
				$('.toggle-funder-profile')
					.addClass('active');
				$('.toggle-recipient-profile')
					.on('click', () => hasher.setHash(`analysis/${iso}/r`));

				$('.country-summary-value.committed').html(App.formatMoneyFormatted(totalFundedCommitted));
				$('.country-summary-value.disbursed').html(App.formatMoneyFormatted(totalFunded));
			} else if (moneyType === 'r') {
				hasNoData = projectsIncludingGroups === undefined || projectsIncludingGroups.length === 0;

				// fill out "switch profile" text and behavior
				$('.toggle-recipient-profile')
					.addClass('active');
				$('.toggle-funder-profile')
					.on('click', () => hasher.setHash(`analysis/${iso}/d`));

				$('.country-summary-value.committed').html(App.formatMoneyFormatted(totalReceivedCommitted));
				$('.country-summary-value.disbursed').html(App.formatMoneyFormatted(totalReceived));
			}

			const codeField = moneyType === 'r' ? 'recipient_country' : 'donor_code';
			const unspecField = moneyType === 'r' ? 'recipient_amount_unspec' : 'donor_amount_unspec';

			const projectsJustForCountry = (iso !== 'ghsa') ? projectsIncludingGroups.filter(d => d[codeField] === iso && d[unspecField] !== true) : projectsIncludingGroups;
			const zeroCommittments = (projectsJustForCountry !== undefined) ? (d3.sum(projectsJustForCountry, d => d.total_committed) === 0) : true;
			const zeroDisbursements = (projectsJustForCountry !== undefined) ? (d3.sum(projectsJustForCountry, d => d.total_spent) === 0) : true;
			const hasNoFinancialData = zeroCommittments && zeroDisbursements;

			$('input[type=radio][value="total_spent"]').prop('checked', true);
			if (zeroDisbursements) {
				$('input[name=fundtype][value=total_committed').prop('checked', true).change();
			}

			// $('.money-type-cap').text('Disbursed');

			$('.toggle-disbursed').click(function () {
				if ($(this).hasClass('active')) {
				} else {
					$('.toggle-disbursed').addClass('active');
					$('.toggle-committed').removeClass('active');
					$('.money-type-cap').text('Disbursed');
				}
			});

			$('.toggle-committed').click(function () {
				if ($(this).hasClass('active')) {
				} else {
					$('.toggle-committed').addClass('active');
					$('.toggle-disbursed').removeClass('active');
					$('.money-type-cap').text('Committed');
				}
			});

			const text = 'The Core Elements are <b>Prevent</b>, <b>Detect</b>, <b>Respond</b> and <b>Other</b>. ' +
				'<b>Other</b> includes Point of Entry (Poe), Chemical Events (CE), and Radiation Emergencies (RE).';
			$('.core-element-text').tooltipster({
				content: text,
			});

			$('.core-capacity-text').tooltipster({
				interactive: true,
				html: true,
				content: App.coreCapacitiesText,
				// content: 'Each core element is associated with one or more core capacities, indicated by prefix.',
			});

			// draw charts
			if (!hasNoData && hasNoFinancialData) {
				$('.progress-circle-section, .category-chart-section, .country-flow-summary .data-area').remove();
				$('.no-data-message.funds').show();
				drawCountryTable('.country-table-section', moneyType);
				if (isGhsaPage) {
					drawCountryTable('.second-country-table-section', (moneyType === 'd') ? 'r' : 'd');
				}
				drawCountryInKindTable();
				const categoryChart = drawCategoryChart();


				categoryChart.selectAll('.y.axis .tick text').each(function addJeeIcons(d) {
					const g = d3.select(this.parentNode);
					const node = g.select('text');
				});

				// display content
				$('.country-flow-content').slideDown();

			} else if (hasNoData) {
				$('.country-flow-summary, .progress-circle-section, .country-chart-container, .country-flow-content, .category-chart-section, .circle-pack-container, .inkind-table-section,.readyscore-circle-section').hide();
				$('.country-flow-summary-empty').slideDown();
				$('.submit-data-btn').click(() => hasher.setHash('submit'))
			} else {
				drawTimeChart();
				drawProgressCircles();
				drawReadyScoreCircles();
				drawCountryTable('.country-table-section', moneyType);
				if (isGhsaPage) {
					drawCountryTable('.second-country-table-section', (moneyType === 'd') ? 'r' : 'd');
				}
				drawCountryInKindTable();
				const categoryChart = drawCategoryChart();


				categoryChart.selectAll('.y.axis .tick text').each(function addJeeIcons(d) {
					const g = d3.select(this.parentNode);
					const node = g.select('text');
				});

				// display content
				$('.country-flow-content').slideDown();
			}
		}

		function drawProgressCircles() {
			$('.progress-circle-title .info-img').tooltipster({
				content: 'The <b>percent of committed funds</b> that were disbursed is shown. ' +
				'However, note that not all projects with disbursals have corresponding commitments, ' +
				'so these figures do not take into account all known funding initiatives.',
			});

			const ccs = ['P', 'D', 'R', 'O', 'General IHR Implementation'];
			const fundsByCc = {};
			ccs.forEach((cc) => {
				fundsByCc[cc] = {
					cc,
					total_committed: 0,
					total_spent: 0,
				};
			});

			let totalSpent = 0;
			let totalCommitted = 0;

			// const projects = (iso !== 'ghsa') ? lookup[iso] : Util.uniqueCollection(lookup[iso], 'project_id');
			let projects = [];
			if (iso !== 'ghsa') {
				projects = App.getFinancialProjectsWithAmounts(lookup[iso], moneyType, iso);
			} else {
				projects = Util.uniqueCollection(lookup[iso], 'project_id')
			}
			projects.forEach((p) => {
				// lookup[iso].forEach((p) => {
				ccs.forEach((cc) => {
					if (cc === 'General IHR Implementation') {
						// General IHR Implementation
						if (p.core_capacities.some(pcc => pcc === cc)) {
							const committed = p.total_committed;
							const spent = p.total_spent;

							// if (spent > committed) spent = committed;
							fundsByCc[cc].total_committed += committed;
							fundsByCc[cc].total_spent += spent;

							totalSpent += spent;
							totalCommitted += committed;
						}
					} else {
						if (cc === 'O' && p.core_capacities.some(pcc => {
								return pcc === 'PoE' || pcc === 'RE' || pcc === 'CE';
							})) {
							const committed = p.total_committed;
							const spent = p.total_spent;

							// if (spent > committed) spent = committed;
							fundsByCc.O.total_committed += committed;
							fundsByCc.O.total_spent += spent;

							totalSpent += spent;
							totalCommitted += committed;
						}
						if (p.core_capacities.some(pcc => cc !== 'O' && cc === pcc.charAt(0))) {
							const committed = p.total_committed;
							const spent = p.total_spent;

							// if (spent > committed) spent = committed;
							fundsByCc[cc].total_committed += committed;
							fundsByCc[cc].total_spent += spent;

							totalSpent += spent;
							totalCommitted += committed;
						}
					}
				});
			});

			const renderProgressCircles = (type) => {

				d3.select('.prevent-circle-chart').select('svg').remove();// remove the existing SVGs
				d3.select('.detect-circle-chart').select('svg').remove();// remove the existing SVGs
				d3.select('.respond-circle-chart').select('svg').remove();// remove the existing SVGs
				d3.select('.other-circle-chart').select('svg').remove();// remove the existing SVGs
				d3.select('.general-circle-chart').select('svg').remove();// remove the existing SVGs

				// need to pass in the type to flex based upon spent / committed
				App.drawProgressCircles('.prevent-circle-chart', fundsByCc.P, totalSpent, totalCommitted, type, color);
				App.drawProgressCircles('.detect-circle-chart', fundsByCc.D, totalSpent, totalCommitted, type, color);
				App.drawProgressCircles('.respond-circle-chart', fundsByCc.R, totalSpent, totalCommitted, type, color);
				App.drawProgressCircles('.other-circle-chart', fundsByCc.O, totalSpent, totalCommitted, type, color);
				App.drawProgressCircles('.general-circle-chart', fundsByCc['General IHR Implementation'], totalSpent, totalCommitted, type, color);
			};


			const percFormat = d3.format('.0%');
			const fillValueText = (valueSelector, ind, totalSpent, totalCommitted, type) => {

				if (type === 'total_spent') {

					if (fundsByCc[ind].total_spent) {
						const pValue = fundsByCc[ind].total_spent / totalSpent;
						$(valueSelector).text(percFormat(pValue));
					} else {
						$(valueSelector).parent().text('No funds disbursed for this core element');
					}

				} else {
					if (fundsByCc[ind].total_committed) {
						const pValue = fundsByCc[ind].total_committed / totalCommitted;
						$(valueSelector).text(percFormat(pValue));
					} else {
						$(valueSelector).parent().text('No funds committed for this core element');
					}
				}


			};

			renderProgressCircles('total_spent');

			$('input[name=fundtype]').change(function () {
				// Get selection and set all radio buttons to that
				const fundTypeChoice = $(this).val();
				$(`input[name=fundtype][value=${fundTypeChoice}]`).prop('checked', true);
				renderProgressCircles(fundTypeChoice);
			});
		}

		function drawReadyScoreCircles() {

			const renderReadyScoreCircles = () => {

				const readyScores = App.getReadyScores(iso);

				const findVerify = readyScores.detectScore;

				const findVerifyCol = App.readyColor(findVerify);
				const findVerifyText = App.readyText(findVerify);

				const stopOutbreaks = readyScores.respondScore;
				const stopOutbreaksCol = App.readyColor(stopOutbreaks);
				const stopOutbreaksText = App.readyText(stopOutbreaks);

				const preventOutbreaks = readyScores.preventScore;
				const preventOutbreaksCol = App.readyColor(preventOutbreaks);
				const preventOutbreaksText = App.readyText(preventOutbreaks);

				const protectFromOther = readyScores.otherScore;
				const protectFromOtherCol = App.readyColor(protectFromOther);
				const protectFromOtherText = App.readyText(protectFromOther);

				d3.select('.find-verify-prevent-circle').select('svg').remove();// remove the existing SVGs
				d3.select('.stop-outbreaks-circle').select('svg').remove();// remove the existing SVGs
				d3.select('.prevent-outbreaks-circle').select('svg').remove();// remove the existing SVGs
				d3.select('.protect-other-circle').select('svg').remove();// remove the existing SVGs

				App.buildReadyScoreChart('.find-verify-prevent-circle', findVerify, findVerifyCol, findVerifyText);
				App.buildReadyScoreChart('.stop-outbreaks-circle', stopOutbreaks, stopOutbreaksCol, stopOutbreaksText);
				App.buildReadyScoreChart('.prevent-outbreaks-circle', preventOutbreaks, preventOutbreaksCol, preventOutbreaksText);
				App.buildReadyScoreChart('.protect-other-circle', protectFromOther, protectFromOtherCol, protectFromOtherText);
			};

			renderReadyScoreCircles();
		}

		const readyText = "ReadyScore is a tool created by Resolve to Save Lives to assess a country's ability to find, stop, and prevent epidemics. The ReadyScore is calculated based on a country's scores on the Joint External Evaluation.";
		$('.readyscore-info-img').tooltipster({
			content: readyText,
		});

		/* When the user clicks on the button,
		toggle between hiding and showing the dropdown content */

		$(document).ready(function () {
			$('#currencyChoice').click(function () {
				$('#currencyDropdown').addClass("show");
			})
		});

		// Close the dropdown if the user clicks outside of it
		window.onclick = function (event) {
			if (!event.target.matches('.currencyOption')) {
				var dropdowns = document.getElementsByClassName("curDropdownContent");
				var i;
				for (i = 0; i < dropdowns.length; i++) {
					var openDropdown = dropdowns[i];
					if (openDropdown.classList.contains('show')) {
						openDropdown.classList.remove('show');
					}
				}
			}
		}

		/**
		 * Draws the "In-kind Contributions Received" or "In-kind Contributions Made"
		 * table that appears on a country analysis page. When on the GHSA special
		 * page, this table contains both the Provider and Recipient columns.
		 * Otherwise, it contains only one or the other.
		 */
		function drawCountryInKindTable() {

			// Set title of section based on whether funder or recipient profile is being viewed
			if (!isGhsaPage) {
				$('.inkind-table-title').text((moneyType === 'd') ? 'In-kind Contributions Made' : 'In-kind Contributions Received');
			} else {
				$('.inkind-table-title').text('In-kind Contributions');
				$('.inkind-table-section .description').text('The table below displays GHSA in-kind contributions in alphabetical order by provider. Click on a row to view details.');
			}

			// get in-kind support projects
			const inkindProjects = lookup[iso].filter(d => d.assistance_type.toLowerCase() === 'in-kind support' || d.assistance_type.toLowerCase() === 'other support');

			// get table data
			const countryInd = (moneyType === 'd') ? 'recipient_country' : 'donor_code';
			const countryIndOther = (moneyType === 'd') ? 'donor_code' : 'recipient_country';
			let fundedData = [];
			const fundedByCountry = {};
			inkindProjects.forEach((p) => {
				const recIso = p[countryInd];
				const isoOther = p[countryIndOther];
				if (recIso !== 'Not reported') {
					if (!fundedByCountry[recIso]) {
						fundedByCountry[recIso] = {
							project_name: p.project_name,
							commitment_disbursements: p.commitment_disbursements,
							iso: recIso,
							iso_other: isoOther,
							entity_name: App.codeToNameMap.get(recIso) || recIso,
							entity_name_other: App.codeToNameMap.get(isoOther) || isoOther,
							total_committed: 0,
							total_spent: 0,
							spent_on_prevent: 0,
							spent_on_detect: 0,
							spent_on_respond: 0,
							spent_on_other: 0,
							committed_on_prevent: 0,
							committed_on_detect: 0,
							committed_on_respond: 0,
							committed_on_other: 0,
						};
					}
					fundedByCountry[recIso].total_committed += p.total_committed;
					fundedByCountry[recIso].total_spent += p.total_spent;
					p.core_capacities.forEach(cc => {
						const ccAbbrev = cc.split('.')[0];
						if (ccAbbrev === 'P') {
							fundedByCountry[recIso].spent_on_prevent += p.total_spent;
							fundedByCountry[recIso].committed_on_prevent += p.total_spent;
						} else if (ccAbbrev === 'D') {
							fundedByCountry[recIso].spent_on_detect += p.total_spent;
							fundedByCountry[recIso].committed_on_detect += p.total_spent;
						} else if (ccAbbrev === 'R') {
							fundedByCountry[recIso].spent_on_respond += p.total_spent;
							fundedByCountry[recIso].committed_on_respond += p.total_spent;
						} else {
							fundedByCountry[recIso].spent_on_other += p.total_spent;
							fundedByCountry[recIso].committed_on_other += p.total_spent;
						}
					})
				}
			});

			for (const recIso in fundedByCountry) {
				fundedData.push(fundedByCountry[recIso]);
			}

			// Do IKS data
			inkindProjects.forEach((p) => {
				const iso = p[countryInd]; // entity to be listed in table
				const isoOther = p[countryIndOther];
				const curData = {
					project_name: p.project_name,
					commitment_disbursements: p.commitment_disbursements,
					iso: iso,
					iso_other: isoOther,
					entity_name: App.codeToNameMap.get(iso) || iso,
					entity_name_other: App.codeToNameMap.get(isoOther) || isoOther,
					total_committed: 0,
					total_spent: 0,
					spent_on_prevent: 0,
					spent_on_detect: 0,
					spent_on_respond: 0,
					spent_on_other: 0,
					committed_on_prevent: 0,
					committed_on_detect: 0,
					committed_on_respond: 0,
					committed_on_other: 0,
				};
				fundedData.push(curData);
			});

			const nameKey = isGhsaPage ? 'entity_name_other' : 'entity_name';
			fundedData = _.sortBy(fundedData, d => {
				return d[nameKey].toLowerCase();
			});

			// remove duplicates
			fundedData = Util.uniqueCollection2(fundedData, 'project_name', 'iso');

			// draw table
			const drawTable = (type) => {
				const typeFilter = type === "total_spent" ? 'disbursement' : 'commitment';
				$('.inkind-table-container').empty();
				const table = d3.select('.inkind-table-container')
					.append('table')
					.classed('inkind-table country-table', true)
					.classed('table', true)
					.classed('table-bordered', true)
					.classed('table-hover', true);

				const header = table.append('thead').append('tr');

				if (!isGhsaPage) {
					const firstColLabel = (moneyType === 'd') ? 'Recipient' : 'Provider';
					header.append('td').html(firstColLabel);
				} else {
					header.append('td').html('Provider');
					header.append('td').html('Recipient')
						.style('padding-left', '63px');

				}
				header.append('td').html('Purpose of contribution');
				const body = table.append('tbody');

				const rows = body.selectAll('tr')
					.data(fundedData.filter(d => d.commitment_disbursements === typeFilter))
					.enter().append('tr')
					.on('click', (d) => {
						if (d.iso !== 'Not reported') {
							App.infoTab = 'inkind';
							if (moneyType === 'd') {
								hasher.setHash(`analysis/${iso}/${d.iso}`);
							} else {
								hasher.setHash(`analysis/${d.iso}/${iso}`);
							}
						}
					});

				// On GHSA special page: Include both the donor and recipient.
				if (isGhsaPage) {
					rows.append('td').html((d) => {
						const recCountry = App.countries.find(c => c.ISO2 === d.iso_other);
						const flagHtml = recCountry ? App.getFlagHtml(d.iso_other) : '';
						let cName = d.iso_other;
						if (App.codeToNameMap.has(d.iso_other)) {
							cName = App.codeToNameMap.get(d.iso_other);
						}
						const onClickStr = `event.stopPropagation();hasher.setHash('analysis/${d.iso_other}/${moneyType === 'd' ? 'r' : 'd'}')`;
						return `<div class="flag-container">${flagHtml}</div>` +
							'<div class="name-container">' +
							`<span onclick="${onClickStr}">${cName}</span>` +
							'</div>';

					});
				}

				rows.append('td').html((d) => {
					const recCountry = App.countries.find(c => c.ISO2 === d.iso);
					const flagHtml = recCountry ? App.getFlagHtml(d.iso) : '';
					let cName = d.iso;
					if (App.codeToNameMap.has(d.iso)) {
						cName = App.codeToNameMap.get(d.iso);
					}
					const onClickStr = `event.stopPropagation();hasher.setHash('analysis/${d.iso}/${moneyType === 'd' ? 'r' : 'd'}')`;
					return `<div class="flag-container">${flagHtml}</div>` +
						'<div class="name-container">' +
						`<span onclick="${onClickStr}">${cName}</span>` +
						'</div>';
				})
					.classed('ghsa-recipient-cell', isGhsaPage);


				rows.append('td').text(d => d.project_name);


				// initialize DataTables plugin
				const infoDataTable = $('.inkind-table').DataTable({
					pageLength: 10,
					scrollCollapse: false,
					autoWidth: true,
					ordering: false,
					deferRender: true,
					// ordering: true,
					// order: [[0, 'asc']],
					bLengthChange: false,
				});
			};
			$('input[name=fundtype]').change(function () {
				// Get selection and set all radio buttons to that
				const fundTypeChoice = $(this).val();
				$(`input[name=fundtype][value=${fundTypeChoice}]`).prop('checked', true);
				drawTable(fundTypeChoice);
			});

			const tableType = $(`input[name=fundtype]:checked`).val();
			drawTable(tableType);

			// If there was no data in the table, say so
			if (fundedData.length === 0) {
				$('.inkind-table-section .data-area').hide();
				$('.inkind-table-section .no-data-description').show();
			}
		};

		/**
		 * Draws the "Top recipients" or "Top funders" table that appears on a
		 * country analysis page.
		 */
		function drawCountryTable(selector, moneyTypeForTable) {
			const $tableContainer = $(selector);
			if (moneyTypeForTable === 'd') {
				$tableContainer.find('.section-title').text('Top recipients');
			} else {
				$tableContainer.find('.section-title').text('Top funders');
			}

			// get table data
			const countryInd = (moneyTypeForTable === 'd') ? 'recipient_country' : 'donor_code';
			const countryIndOther = (moneyTypeForTable === 'd') ? 'donor_code' : 'recipient_country';

			// If "Top funders" table:
			let fundedData = [];
			const fundedByCountry = {};

			const codeField = (moneyTypeForTable === 'd') ? 'recipient_country' : 'donor_code';
			const codeFieldOther = (moneyTypeForTable === 'd') ? 'donor_code' : 'recipient_country';

			const unspecField = moneyType === 'r' ? 'recipient_amount_unspec' : 'donor_amount_unspec';
			const unspecFieldOther = moneyType === 'r' ? 'donor_amount_unspec' : 'recipient_amount_unspec';


			// nameField is the original
			// name field for the recipient if hte table is
			// "Top recipients" or the donor if its "Top funders"
			const nameFieldOrig = (moneyTypeForTable === 'd') ? 'recipient_name_orig' : 'donor_name_orig';
			const nameFieldOrigOther = (moneyTypeForTable === 'd') ? 'donor_name_orig' : 'recipient_name_orig';
			const nameField = (moneyTypeForTable === 'd') ? 'recipient_name' : 'donor_name';
			const nameFieldOther = (moneyTypeForTable === 'd') ? 'donor_name' : 'recipient_name';

			// Get financial data for the table
			const tableDataTmp = lookup[iso]
				.filter(payment => payment.assistance_type.toLowerCase() !== 'in-kind support' && payment.assistance_type.toLowerCase() !== 'other support');

			// Get the "entities" (either top funders/recipients)
			const projectArrays = _.values(_.groupBy(tableDataTmp, 'project_id'));

			const tableRowsByCodeOrName = {};


			// GHSA special code:
			// keep only first project in each array
			const projectsToIterateOn = projectArrays.map(d => d[0]);

			// For each project, take the original or present name
			// and record the amounts
			projectsToIterateOn.forEach(p => {
				// If name field is defined, use it
				const codeOrName = p[nameFieldOrig] !== undefined ? p[nameFieldOrig] : p[codeField];
				const isoForTableFlag = p[nameFieldOrig] !== undefined ? '' : p[codeField];
				const nameForTable = p[nameFieldOrig] !== undefined ? p[nameFieldOrig] : p[nameField];

				// Add default data for the table if they don't yet exist.
				if (codeOrName === 'Not reported') return;
				if (!tableRowsByCodeOrName[codeOrName]) {
					tableRowsByCodeOrName[codeOrName] = {
						name: nameForTable,
						iso: isoForTableFlag,
						total_committed: 0,
						total_spent: 0,
						spent_on_prevent: 0,
						spent_on_detect: 0,
						spent_on_respond: 0,
						spent_on_other: 0,
						spent_on_general: 0,
						committed_on_prevent: 0,
						committed_on_detect: 0,
						committed_on_respond: 0,
						committed_on_other: 0,
						committed_on_general: 0,
						all_unspec_amounts: true, // will always show full proj value for GHSA page
					};
				}

				const matchesIso = p[codeFieldOther] === iso;
				const amountSpecified = p[unspecField] !== true;
				const amountNotReportedAtAll = p.no_value_reported;
				const isGhsaPage = iso === 'ghsa';

				if ((((matchesIso && amountSpecified) && !isGhsaPage) || isGhsaPage) && !amountNotReportedAtAll) {
					tableRowsByCodeOrName[codeOrName].all_unspec_amounts = false
					// Increment counts
					tableRowsByCodeOrName[codeOrName].total_committed += p.total_committed;
					tableRowsByCodeOrName[codeOrName].total_spent += p.total_spent;

					p.core_capacities.forEach(cc => {
						const ccAbbrev = cc.split('.')[0];
						if (ccAbbrev === 'P') {
							tableRowsByCodeOrName[codeOrName].spent_on_prevent += p.total_spent;
							tableRowsByCodeOrName[codeOrName].committed_on_prevent += p.total_committed;
						} else if (ccAbbrev === 'D') {
							tableRowsByCodeOrName[codeOrName].spent_on_detect += p.total_spent;
							tableRowsByCodeOrName[codeOrName].committed_on_detect += p.total_committed;
						} else if (ccAbbrev === 'R') {
							tableRowsByCodeOrName[codeOrName].spent_on_respond += p.total_spent;
							tableRowsByCodeOrName[codeOrName].committed_on_respond += p.total_committed;
						} else if (ccAbbrev === 'General IHR Implementation') {
							tableRowsByCodeOrName[codeOrName].spent_on_general += p.total_spent;
							tableRowsByCodeOrName[codeOrName].committed_on_general += p.total_committed;
						} else {
							tableRowsByCodeOrName[codeOrName].spent_on_other += p.total_spent;
							tableRowsByCodeOrName[codeOrName].committed_on_other += p.total_committed;
						}
					});
				}

			});

			// Map data for display in table
			const tableData2 = [];
			for (const key in tableRowsByCodeOrName) {
				tableData2.push(tableRowsByCodeOrName[key]);
			}

			lookup[iso]
				.filter(payment => payment.assistance_type.toLowerCase() !== 'in-kind support' && payment.assistance_type.toLowerCase() !== 'other support')
				.forEach((p) => {
					const recIso = p[countryInd];
					if (recIso !== 'Not reported') {
						if (!fundedByCountry[recIso]) {
							fundedByCountry[recIso] = {
								iso: recIso,
								total_committed: 0,
								total_spent: 0,
								spent_on_prevent: 0,
								spent_on_detect: 0,
								spent_on_respond: 0,
								spent_on_other: 0,
								spent_on_general: 0,
								committed_on_prevent: 0,
								committed_on_detect: 0,
								committed_on_respond: 0,
								committed_on_other: 0,
								committed_on_general: 0,
								all_unspec_amounts: true,
							};
						}
						fundedByCountry[recIso].total_committed += p.total_committed;
						fundedByCountry[recIso].total_spent += p.total_spent;
						const isoMatch = (p[countryIndOther] === iso || iso === 'ghsa');
						if (isoMatch && !p.no_value_reported) fundedByCountry[recIso].all_unspec_amounts = false;
						p.core_capacities.forEach(cc => {
							const ccAbbrev = cc.split('.')[0];
							if (ccAbbrev === 'P') {
								fundedByCountry[recIso].spent_on_prevent += p.total_spent;
								fundedByCountry[recIso].committed_on_prevent += p.total_committed;
							} else if (ccAbbrev === 'D') {
								fundedByCountry[recIso].spent_on_detect += p.total_spent;
								fundedByCountry[recIso].committed_on_detect += p.total_committed;
							} else if (ccAbbrev === 'R') {
								fundedByCountry[recIso].spent_on_respond += p.total_spent;
								fundedByCountry[recIso].committed_on_respond += p.total_committed;
							} else if (ccAbbrev === 'General IHR Implementation') {
								fundedByCountry[recIso].spent_on_general += p.total_spent;
								fundedByCountry[recIso].committed_on_general += p.total_committed;
							} else {
								fundedByCountry[recIso].spent_on_other += p.total_spent;
								fundedByCountry[recIso].committed_on_other += p.total_committed;
							}
						})
					}
				});

			// If the only payments are for "group" F/R then mark value as unspecified
			for (const recIso in fundedByCountry) {
				fundedData.push(fundedByCountry[recIso]);
			}
			Util.sortByKey(fundedData, 'total_spent', true);

			// draw table
			const drawTable = (type) => {
				$tableContainer.find('.table-container').empty();
				const table = d3.select(selector).select('.table-container')
					.append('table')
					.classed('country-table funds-table', true)
					.classed('table', true)
					.classed('table-bordered', true)
					.classed('table-hover', true);

				const header = table.append('thead').append('tr');
				const firstColLabel = (moneyTypeForTable === 'd') ? 'Recipient' : 'Funder';
				const lastColLabel = (type === 'total_spent') ? 'Total Disbursed' : 'Total Committed';

				header.append('td').html(firstColLabel);
				header.append('td').html(lastColLabel);

				header.append('td').html('Prevent');
				header.append('td').html('Detect');
				header.append('td').html('Respond');
				header.append('td').html('Other');
				header.append('td').html('General IHR <img class="general-ihr-info-img info-img" src="img/info.png" />');

				const body = table.append('tbody');
				fundedData = tableData2;

				const rows = body.selectAll('tr')
					.data(fundedData.sort((a, b) => {
						if (a[type] < b[type]) {
							return 1;
						} else {
							return -1;
						}
					}))
					.enter().append('tr')
					.on('click', (d) => {
						if (d.iso !== 'Not reported' && d.iso !== '') {
							if (moneyTypeForTable === 'd') {
								hasher.setHash(`analysis/${iso}/${d.iso}`);
							} else {
								hasher.setHash(`analysis/${d.iso}/${iso}`);
							}
						}
					});
				rows.append('td').html((d) => {
					const recCountry = App.countries.find(c => c.ISO2 === d.iso);
					const flagHtml = recCountry ? App.getFlagHtml(d.iso) : '';
					let cName = d.name || d.iso;
					if (App.codeToNameMap.has(d.iso)) {
						cName = App.codeToNameMap.get(d.iso);
					}
					const onClickStr = `event.stopPropagation();hasher.setHash('analysis/${d.iso}/${moneyTypeForTable === 'd' ? 'r' : 'd'}')`;
					return `<div class="flag-container">${flagHtml}</div>` +
						'<div class="name-container">' +
						`<span onclick="${onClickStr}">${cName}</span>` +
						'</div>';
				});

				function getCellText(d, val) {
					if (d.all_unspec_amounts) return '--';
					return App.formatMoney(val)
				};

				rows.append('td').text(function (d) {
					if (d.all_unspec_amounts) {
						d3.select(this).attr('data-sort', -1000);
						return 'Specific amount unknown';
					} else {
						d3.select(this).attr('data-sort', d[type]);
						return App.formatMoney(d[type]);
					}
				});
				if (type === 'total_spent') {
					rows.append('td').attr('class', 'slightly-dark').text(d => getCellText(d, d.spent_on_prevent));
					rows.append('td').attr('class', 'slightly-dark').text(d => getCellText(d, d.spent_on_detect));
					rows.append('td').attr('class', 'slightly-dark').text(d => getCellText(d, d.spent_on_respond));
					rows.append('td').attr('class', 'slightly-dark').text(d => getCellText(d, d.spent_on_other));
					rows.append('td').attr('class', 'slightly-dark').text(d => getCellText(d, d.spent_on_general));
				} else {
					rows.append('td').attr('class', 'slightly-dark').text(d => getCellText(d, d.committed_on_prevent));
					rows.append('td').attr('class', 'slightly-dark').text(d => getCellText(d, d.committed_on_detect));
					rows.append('td').attr('class', 'slightly-dark').text(d => getCellText(d, d.committed_on_respond));
					rows.append('td').attr('class', 'slightly-dark').text(d => getCellText(d, d.committed_on_other));
					rows.append('td').attr('class', 'slightly-dark').text(d => getCellText(d, d.committed_on_general));
				}

				// initialize DataTables plugin
				const infoDataTable = $tableContainer.find('.table').DataTable({
					pageLength: 10,
					scrollCollapse: false,
					autoWidth: false,
					deferRender: true,
					ordering: true,
					order: [1, 'desc'],
					bLengthChange: false,
				});

				// Tooltip for General IHR Implementation
				$tableContainer.find('.general-ihr-info-img').tooltipster({
					interactive: true,
					content: App.generalIhrText,
				});
			};

			const tableType = $(`input[name=fundtype]:checked`).val();
			drawTable(tableType);

			$('input[name=fundtype]').change(function () {
				// Get selection and set all radio buttons to that
				const fundTypeChoice = $(this).val();
				$(`input[name=fundtype][value=${fundTypeChoice}]`).prop('checked', true);
				drawTable(fundTypeChoice);
			});

			// If there was no data in the table, say so
			if (fundedData.length === 0) {
				$tableContainer.find('.data-area').hide();
				$tableContainer.find('.no-data-description').show();
			}
		}

		function drawCategoryChart() {
			// get data
			const countryInd = (moneyType === 'd') ? 'recipient_country' : 'donor_code';
			const catData = [];
			const fundsByCat = {};

			let projects = [];
			if (iso !== 'ghsa') {
				projects = App.getFinancialProjectsWithAmounts(lookup[iso], moneyType, iso);
			} else {
				projects = Util.uniqueCollection(lookup[iso], 'project_id')
			}

			/**
			 * Returns the name of the funder/recipient of the project that should be displayed
			 * in the UI. If the funder/recipient is a group of entities then the group of
			 * entities is displayed.
			 * @param  {object} p         The project
			 * @param  {string} moneyType 'd' (funded) or 'r' (received)
			 * @return {string}           The funder/recipient name to display
			 */
			function getEntityDisplayName(p, moneyType) {
				// if funded, need recipient name
				if (moneyType === 'd') {
					return p.recipient_name_orig || p.recipient_name;
				} else {
					return p.donor_name_orig || p.donor_name;
				}
			};

			projects.forEach((p) => {
				// lookup[iso].forEach((p) => {
				const recIso = p[countryInd];
				const catValues = p.core_capacities;
				catValues.forEach((c) => {
					if (!fundsByCat[c]) fundsByCat[c] = {};
					if (!fundsByCat[c][recIso]) {
						fundsByCat[c][recIso] = {
							iso: recIso,
							name: getEntityDisplayName(p, moneyType),
							otherName: getEntityDisplayName(p, moneyType === 'd' ? 'r' : 'd'),
							total_committed: 0,
							total_spent: 0,
						};
					}
					fundsByCat[c][recIso].total_committed += p.total_committed;
					fundsByCat[c][recIso].total_spent += p.total_spent;
				});
			});
			App.capacities.forEach((cap) => {
				// if (cap.id !== 'General IHR Implementation') {
				if (fundsByCat[cap.id]) {
					const countries = [];
					let totalCommitted = 0;
					let totalSpent = 0;
					for (const recIso in fundsByCat[cap.id]) {
						countries.push(fundsByCat[cap.id][recIso]);
						totalCommitted += fundsByCat[cap.id][recIso].total_committed;
						totalSpent += fundsByCat[cap.id][recIso].total_spent;
					}
					catData.push({
						id: cap.id,
						name: cap.name,
						children: countries,
						total_committed: totalCommitted,
						total_spent: totalSpent,
					});
				} else {
					catData.push({
						id: cap.id,
						name: cap.name,
						children: [],
						total_committed: 0,
						total_spent: 0,
					});
				}
				// }
			});
			Util.sortByKey(catData, 'total_spent', true);

			const largestSpent = d3.mean(
				catData.reduce(
					(acc, cval) => acc.concat(cval.children), []),
				d => d.total_spent);
			const largestCommitted = d3.mean(
				catData.reduce(
					(acc, cval) => acc.concat(cval.children), []),
				d => d.total_spent);

			const smallData = catData.map(d => {
				const newD = Object.assign({}, d);
				newD.children = d.children
					.filter(c => (c.total_committed < largestCommitted) || (c.total_spent < largestSpent));
				newD.total_spent = newD.children
					.reduce((acc, cval) => acc + cval.total_spent, 0);
				newD.total_committed = newD.children
					.reduce((acc, cval) => acc + cval.total_committed, 0);
				return newD;
			});

			var selected = 'total_spent';
			var filterData = 'big';

			const chart = App.buildCategoryChart('.category-chart-container', {
				moneyType,
				showJee,
				scores: App.scoresByCountry[iso],
			});

			chart.update(catData, selected, {isGhsaPage});

			$('input[name=fundtype]').change(function () {
				// Get selection and set all radio buttons to that
				const fundTypeChoice = $(this).val();
				$(`input[name=fundtype][value=${fundTypeChoice}]`).prop('checked', true);
				updateData(fundTypeChoice);
			});

			// put init jee chart stuff here
			if (!showJee) {
				$('.jee-sort-options').remove();
			} else {
				$('.analysis-country-content .jee-sort-options .ind-type-filter .radio-option').off('click');
				$('.analysis-country-content .jee-sort-options .ind-type-filter .radio-option').click(function updateJeeSort() {
					updateData();
				});

				// init tooltip
				$('.jee-info-img').tooltipster({
					interactive: true,
					content: `The colored circles represent the average rounded score of the indicators in each core capacity (e.g., P.1) published in the country\'s most recent JEE Assessment.`,
				});

				// if showing JEE scores, build the legend for them
				addJeeScoreLegendBox();
			}


			const updateData = (fundTypeChoice) => {
				if (filterData === 'small') {
					chart.update(smallData, fundTypeChoice, {isGhsaPage});
				} else {
					chart.update(catData, fundTypeChoice, {isGhsaPage});
				}
				if (fundTypeChoice === 'total_spent') {
					$('.money-type').text('disbursed');
					if (moneyType === 'r') {
						// $('.money-type').text('recieved');
					} else {
						// $('.money-type').text('disbursed');
					}
				} else {
					$('.money-type').text('committed');
				}
			}
			return chart;
		}

		function drawTimeChart() {
			// get data
			const timeData = [];
			const fundsByYear = {};
			for (let i = App.dataStartYear; i <= App.dataEndYear; i++) {
				fundsByYear[i] = {
					year: i,
					total_committed: 0,
					total_spent: 0,
				};
			}
			const codeField = moneyType === 'r' ? 'recipient_country' : 'donor_code';
			const unspecField = moneyType === 'r' ? 'recipient_amount_unspec' : 'donor_amount_unspec';
			const projects = (iso !== 'ghsa') ? lookup[iso] : Util.uniqueCollection(lookup[iso], 'project_id');
			projects.forEach((p) => {
				if (iso !== 'ghsa' && (iso !== p[codeField] || p[unspecField] === true)) return;
				for (let i = App.dataStartYear; i <= App.dataEndYear; i++) {
					fundsByYear[i].total_committed += p.committed_by_year[i];
					fundsByYear[i].total_spent += p.spent_by_year[i];
				}
			});
			for (const y in fundsByYear) {
				timeData.push(fundsByYear[y]);
			}

			const countryName = App.codeToNameMap.get(iso);

			App.buildLineTimeChart('.time-chart-graphic', timeData, {
				color,
				middleColor,
				lightColor,
				moneyType,
			}, countryName);

		}

		init();
	};
})();
