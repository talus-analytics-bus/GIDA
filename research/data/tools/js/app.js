const App = {};

(() => {

	const DEBUG = false;

	// Loads the current 'funding_data' dataset to be played with
	App.loadFundingData = () => {
		const path = './data/';
		const fn = 'funding_data_v12.json';
		console.log('Loading funding data...');
			d3.queue()
				.defer(d3.json, path + fn)
				.await((error, data) => {
					console.log('loading complete:');
					console.log(data);
			});
	};
const sectorAid = [
    "12110",
    "12181",
    "12182",
    "12191",
    "12220",
    "12230",
    "12240",
    "12250",
    "12261",
    "12262",
    "12263",
    "12281",
    "13010",
    "13020",
    "13030",
    "13040",
    "13081",
    "31195",
    "16064",	// Social mitigation of HIV/AIDS 
    "32168",	// Pharmaceutical production 
    // "14050"	// Waste management / disposal (don't include in application data yet)
  ];

	// Keep only activities from iati_activities.json
	// that have the right sector *OR* are WHO funder_ref
	App.filterActivities = () => {
		d3.queue()
			.defer(d3.json, 'data/iati_activities-101217-MV.json')
			.await((error, data) => {
				console.log('Activities data loaded');
				console.log('filtering...');
				const filteredActs = data.rows.filter(d => {
					return sectorAid.indexOf(d.sector_code) > -1 || d.funder_ref === "XM-DAC-928";
				});
				console.log('done!');
				Util.save(filteredActs, 'filtered_activities.json');
			});
	};

	// Keeps only those transactions associated with a project AID that has
	// a health sector group
	/* filterTransactionsBySector
	*  Operates on the data grabbed by App.getIatiTransactions, and keeps only data that meet these conditions:
	*  Activity is tagged with sector group 121 or 122 (health)
	*  Activity is tagged with sector code 31195 (Livestock/Veterinary services)
	*  Activity funder_ref is the World Health Organisation (funder_ref === )
	*/
	App.aidCodesForSteph = [];
	App.filterTransactionsBySector = () => {


		

		console.log('Loading transactions data...');
		d3.queue()
			.defer(d3.json, 'data/rawTransactions.json')
			.await((error, data) => {
				console.log('Transactions data loaded:');
				console.log(data);

				// Get list of activities with right sectors
				console.log("Getting list of 'aid' values that should be included in data...")
				const aidCodesToUse = _.unique(_.pluck(iatiActivities,'aid'));
				console.log(aidCodesToUse);

				console.log("Filtering transactions data for only those 'aid' values...");

				const filteredTransactions = data.filter((d) => {
					// const isRightSector = sectorAid.indexOf(d.aid) > -1; // keep correct sector
					// const isWhoFunderRef = d.funder_ref === "XM-DAC-928"; // keep if WHO was funder regardless of sector
					// if (isRightSector || isWhoFunderRef) App.aidCodesForSteph.push(d.aid);
					// return isRightSector || isWhoFunderRef;
					return aidCodesToUse.indexOf(d.aid) > 1;
				});

				console.log('Filtered transactions data loaded:');
				console.log(filteredTransactions.length);
				Util.save(filteredTransactions, 'filteredTransactions.json');
			});
	};


		// App.aidCodesForSteph = [];
	App.loadRawTransactions = () => {


		

		console.log('Loading transactions data...');
		d3.queue()
			.defer(d3.json, 'data/rawTransactions.json')
			.await((error, data) => {
				console.log('Transactions data loaded:');
				console.log(data)
				// console.log(data);

				// // Get list of activities with right sectors
				// console.log("Getting list of 'aid' values that should be included in data...")
				// const aidCodesToUse = _.unique(_.pluck(iatiActivities,'aid'));
				// console.log(aidCodesToUse);

				// console.log("Filtering transactions data for only those 'aid' values...");

				// const filteredTransactions = data.filter((d) => {
				// 	// const isRightSector = sectorAid.indexOf(d.aid) > -1; // keep correct sector
				// 	// const isWhoFunderRef = d.funder_ref === "XM-DAC-928"; // keep if WHO was funder regardless of sector
				// 	// if (isRightSector || isWhoFunderRef) App.aidCodesForSteph.push(d.aid);
				// 	// return isRightSector || isWhoFunderRef;
				// 	return aidCodesToUse.indexOf(d.aid) > 1;
				// });

				// console.log('Filtered transactions data loaded:');
				// console.log(filteredTransactions.length);
				// Util.save(filteredTransactions, 'filteredTransactions.json');
			});
	};

	/* getIatiTransactions
	*  Downloads all transactions from d-portal for activities with start dates on or after 1 Jan 2014
	*/
	App.getIatiTransactions = () => {
		console.log('Running App.getIatiTransactions');

		$.ajax({
			type: 'post',
			url: 'https://cors-anywhere.herokuapp.com/https://d-portal.org/q.json?limit=900000&from=trans,act,country&day_start_gt=2014-01-01&select=aid,funder_ref,title,country_code,country_percent,trans_code,trans_usd,trans_day',
			// url: 'https://cors-anywhere.herokuapp.com/https://d-portal.org/q.json?limit=90000&from=trans,act,country&day_start_gt=2014-01-01&select=aid,reporting_ref,funder_ref,title,country_code,country_percent,trans_code,trans_usd,trans_day',
			// url: 'https://cors-anywhere.herokuapp.com/https://d-portal.org/q.json?limit=90000&from=trans,sector,act,country&sector_group=121&sector_group=122&day_start_gt=2014-01-01&select=aid,reporting_ref,funder_ref,title,country_code,country_percent,trans_code,trans_usd,trans_day',
			success: function(data) {
				console.log('got it!');
				console.log(data)
				Util.save(data)
			},
			error: function(){
				console.log('error');
			}
		});
	};

	/* getIatiActivities
	*  tests the IATI data downloaded into JSON format
	*  Currently gets projects with sector codes from this list:
	* 12110
	* 12181
	* 12182
	* 12191
	* 12220
	* 12230
	* 12240
	* 12250
	* 12261
	* 12262
	* 12263
	* 12281
	* 13010
	* 13020
	* 13030
	* 13040
	* 13081
	* 31195
	*/
	App.getIatiActivities = () => {
		console.log('Running App.getIatiActivities');

		const queryJson = {
		  "limit": "2000000",
		  "from": "sector,act",
		  "flags": "0",
		  "day_start_gt": "2014-01-01",
		  "select": "aid,sector_code,funder_ref,title,description"/*,
		  "sector_code": [
		    "12110",
		    "12181",
		    "12182",
		    "12191",
		    "12220",
		    "12230",
		    "12240",
		    "12250",
		    "12261",
		    "12262",
		    "12263",
		    "12281",
		    "13010",
		    "13020",
		    "13030",
		    "13040",
		    "13081",
		    "31195",
		    "16064",	// Social mitigation of HIV/AIDS (don't include in application data yet)
		    "32168",	// Pharmaceutical production (don't include in application data yet)
		    "14050",	// Waste management / disposal (don't include in application data yet)
		  ]*/
		};

		const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
		const url = Util.getQueryUrl(proxyUrl, queryJson);

		$.ajax({
			type: 'post',
			url: url,
			// url: 'https://cors-anywhere.herokuapp.com/https://d-portal.org/q.json?limit=90000&from=sector,act&flags=0&sector_code=12110&sector_code=12181&sector_code=12182&sector_code=12191&sector_code=12220&sector_code=12230&sector_code=12240&sector_code=12250&sector_code=12261&sector_code=12262&sector_code=12263&sector_code=12281&sector_code=13010&sector_code=13020&sector_code=13030&sector_code=13040&sector_code=13081&sector_code=31195&select=aid,sector_code,day_start,day_end,spend,commitment,flags,funder_ref',
			// url: 'https://cors-anywhere.herokuapp.com/https://d-portal.org/q.json?limit=90000&from=sector,act&sector_code=12110&sector_code=12181&sector_code=12182&sector_code=12191&sector_code=12220&sector_code=12230&sector_code=12240&sector_code=12250&sector_code=12261&sector_code=12262&sector_code=12263&sector_code=12281&sector_code=31195&flags=0&select=aid,sector_code,day_start,day_end,spend,commitment,flags',
			// url: 'https://cors-anywhere.herokuapp.com/https://d-portal.org/q.json?limit=90000&from=sector,act&sector_group=121&sector_group=122&select=aid,sector_code,day_start,day_end,spend,commitment',
			success: function(data) {
				console.log('got it!');
				console.log(data)

				Util.save(data,'iati_activities.json');
			},
			error: function(){
				console.log('error');
			}
		});
	};


	// Define the unspecified function/disease tag to be pushed
	// if the tag(s) are not defined for the project
	const unspecTag = [{p: "Unspecified", c: null}];

	/* getFunctionTags
	*  gets the function tags for the data
	*/
	App.getFunctionTags = (input) => {
		if (input === null || input.length === 0) return unspecTag;
		// for each tag in the input arr
		outputTags = [];
		for (let i = 0; i < input.length; i++) {
			// get sector code text
			const sectorTag = Util.iatiSectorCodeHash[input[i]];
			if (sectorTag === undefined) {
				// outputTags = _.union(outputTags, unspecTag);
				continue;
			}
			else {
				if (Util.iatiDiseaseFunctionHash[sectorTag] === undefined) {
					// console.log(sectorTag);
					continue;
				}
				const outputTmp = Util.iatiDiseaseFunctionHash[sectorTag].function_tags;
				if (outputTmp === undefined) {
					// outputTags = _.union(outputTags, unspecTag);
					continue;
				} else {
					outputTags = _.union(outputTags, outputTmp);
				}
			}
		}
		if (outputTags.length === 0) return unspecTag;
		else return _.unique(outputTags);
	};

	/* getDiseaseTags
	*  gets the disease tags for the data
	*/
	App.getDiseaseTags = (input) => {
		if (input === null || input.length === 0) return unspecTag;
		// for each tag in the input arr
		outputTags = [];
		for (let i = 0; i < input.length; i++) {
			// get sector code text
			const sectorTag = Util.iatiSectorCodeHash[input[i]];
			if (sectorTag === undefined) {
				// outputTags = _.union(outputTags, unspecTag);
				continue;
			}
			else {
				if (Util.iatiDiseaseFunctionHash[sectorTag] === undefined) {
					// console.log(sectorTag);
					continue;
				}
				const outputTmp = Util.iatiDiseaseFunctionHash[sectorTag].disease_tags;

				if (outputTmp === undefined) {
					// outputTags = _.union(outputTags, unspecTag);
					continue;
				} else {
					outputTags = _.union(outputTags, outputTmp);
				}
			}
		}
		if (outputTags.length === 0) return unspecTag;
		else return _.unique(outputTags);
	};

	/* getDonorData
	*  gets name, sector, and country of donor
	*/
	App.undefinedDonorNames = [];
	App.getDonorData = (input) => {
		// input is funder_ref (cross-reference with ctrack data)
		output = {};
		if (input === null) return {name: "Not reported", sector: "Not reported", country: "Not reported"};
		else if (input === "XI-IATI-21032") input = "XM-DAC-7"; // PSI incorrectly listed as funder for some NL government projs
		else if (input === "XI-IATI-BWCO20151011") input = "BW-CIPA-CO20151011" // code for ITPC changed
		else if (input === "UNDP") input = "XM-DAC-41114" // code for UNDP; sometimes people just write "UNDP"
		else if (input === "UNFPA") input = "41119" // code for UNFPA; sometimes people just write "UNFPA"
		else if (input === "UNICEF") input = "41122" // code for UNICEF; sometimes people just write "UNFPA"
		let donorData = publishers_data.find(d => d.publisher_iati_id === input);
		if (donorData === undefined) {
			donorData = Util.funder_aux_hash[input];
			if (donorData === undefined) {
				App.undefinedDonorNames.push(input);
				// donorData = Util.funder_aux_hash[input];
					donorData = {name: 'error', sector: 'error', country:'error'};
			}
			output.donor_name = donorData.name;
			output.donor_sector = donorData.sector;
			const donor_country_tmp = countries_json.find(d => d.NAME === donorData.country);
			if (donor_country_tmp !== undefined) output.donor_country = donor_country_tmp.ISO2;
			else output.donor_country = "Not reported";
			// output.donor_country = donorData.country;
		} else {
			output.donor_name = Util.publisher_names[input];
			output.donor_sector = Util.organization_type["OrganisationType"].find(d => d.code === donorData.publisher_organization_type).name;
			const donor_country_tmp = countries_json.find(d => d.ISO2 === donorData.publisher_country);
			if (donor_country_tmp === undefined) {
				output_donor_country = "International";
			} else {
				output.donor_country = donor_country_tmp.ISO2;
			}
		}
		if (output.donor_name === undefined) output.donor_name = "Not reported";
		if (output.donor_country === undefined) output.donor_country = "Not reported";
		if (output.donor_sector === undefined) output.donor_sector = "Not reported";
		return output;
	};

	/* getRecipientData
	*  gets name, sector, and country of recipient
	*/
	App.getRecipientData = (input) => {
		// input is country code, 2-char (cross-reference with country data)
		output = {};

		const country_data = countries_json.find(d => d.ISO2 === input);



		if (country_data === undefined) {
			const aux_country_hash = {
				"XK":"Kosovo",
				"SS":"South Sudan",
				"KES":"Kenya",
				"UK":"United Kingdom",
				"LBR":"Liberia",
				"TP":"Timor-Leste",
				"YV":"Venezuela",
				"QNB":"Venezuela"
			};
			output.recipient_name = aux_country_hash[input];
			if (output.recipient_name === undefined) {
				output = {recipient_name: "Not reported", recipient_sector: "Not reported", recipient_country: "Not reported" };
			}
		} else {
			output.recipient_name = country_data.NAME;
			output.recipient_sector = "Country";
			output.recipient_country = input; // country_code, 2-char
		}
		if (output.recipient_name === undefined) output.recipient_name = "Not reported";
		if (output.recipient_sector === undefined) output.recipient_sector = "Not reported";
		if (output.recipient_country === undefined) output.recipient_country = "Not reported";
		return output;
	};

	/* getTransType
	*  gets transaction type based on trans_code
	*/
	App.allTransTypes = [];
	App.getTransType = (input) => {
		App.allTransTypes.push(input);
		if (input === null) return 'not reported';

		// input is trans_code
		const output = Util.old_transaction_type[input].toLowerCase();
		return output;
	};


	// perform text matching on a string to see what JEE CCs to tag the project with
	App.searchForJeeCcs = (stringToMatchOn) => {
		let matchingCcs = [];
		console.log('getting matches...')
		Util.ccHash.forEach(test => {
			const caseSensitive = test.kw.toLowerCase() !== test.kw;
			if (caseSensitive) {
				const caseSensitiveMatch = stringToMatchOn.indexOf(test.kw) > -1;
				if (caseSensitiveMatch) {
					matchingCcs = _.union(matchingCcs, [test.cc]);
				}
			} else {
				const caseInsensitiveMatch = stringToMatchOn.toLowerCase().indexOf(test.kw) > -1;
				if (caseInsensitiveMatch) {
					matchingCcs = _.union(matchingCcs, [test.cc]);
				}
			}
		});
		return matchingCcs;
	};

	// tag JEE CCs for each project using text matching and sector keyword
	// hashing
	App.missingAid = [];
	App.tagJeeCcs = (projects) => {
		// if (DEBUG) projects = projects.slice(0,100); // DEBUG sample only
		d3.queue()
			.defer(d3.json, './data/translated_descs2.json')
			.await((error, translated_descs) => {
				// console.log(translated_descs[0]);
				// for each proj
				projects.forEach(project => {
					// if project is from IATI, use description translation
					const isIati = project.source.name === "IATI via D-Portal";

					if (isIati) {
						// get aid for cur prj
						const curAid = project.source.id;

						// find matching activity to get the translated descs
						// DESCRIPTIONS
						const matchTrns = translated_descs.find(d => d.aid === curAid);

						let stringToMatchOn = '';
						if (matchTrns === undefined) {
							// console.log('missing desc trans for: ' + curAid);
							// if no match for project description, do one for its title and use that
							const matchAct = iatiActivities.find(d => d.aid === curAid);
							App.translate(matchAct.title, (result) => {
								// do JEE lookup on this text;
								stringToMatchOn = result;
								project.title_trns = stringToMatchOn;
								project.core_capacities = [];
								project.core_capacities = App.searchForJeeCcs(stringToMatchOn);
							});
						} else {
							stringToMatchOn = matchTrns.desc_trns;
							project.desc_trns = stringToMatchOn;
							project.core_capacities = App.searchForJeeCcs(stringToMatchOn);
						}

						// TITLES (todo)
						// TODO
					} else {
						// if project is from article X, use description and title
						console.log("Article X project")
						let stringToMatchOn = project.project_name + project.project_desc;
						project.core_capacities = [];
						project.core_capacities = App.searchForJeeCcs(stringToMatchOn);
					}
				});
			});
	};

	// add the D.4 Workforce Development JEE CC if the right sectors are tagged
	App.tagJeeCcsBasedOnSector = (projects) => {
		projects.forEach(project => {
			// // remove D.4 if present
			// project.core_capacities = _.without(project.core_capacities, "D.4");

			// get project sectors
			const activities_for_proj = iatiActivities.filter(d => d.aid === project.source.id);
			const curSectorCodes = _.unique(_.pluck(activities_for_proj, 'sector_code'));

			// if any are a match for D.4, add it to the project's CCs
			const d4_dac_codes = [
				"12181",
				"12281",
				"13081"
			];

			const p1_dac_code = "12110";
			const matchingCodes = _.intersection(d4_dac_codes, curSectorCodes);
			// console.log(curSectorCodes)
			if (matchingCodes.length > 0) {
				project.core_capacities = _.union(project.core_capacities,["D.4"]);
			}

			// p.1 match
			if (curSectorCodes.indexOf(p1_dac_code) > -1) {
				project.core_capacities = _.union(project.core_capacities,["P.1"]);

			}
		});
	};

	// removes spurious 3MDG projects for now until we know how to process them
	App.removeUnhealthyRecords = (projects) => {
		const projNameToRemove = "Three Millennium Development Goal Fund (3MDG Multi Donor Fund)";
		projects = projects.filter(project => {
			return project.project_name !== projNameToRemove;
		});
	};

	/* mapDataIati
	*  map the IATI data downloaded into JSON format into the app data structure
	*/
	App.mapDataIati = () => {
		
		console.log('Running App.mapDataIati');

		// grab transactions
		let transactions = iatiRaw;
		if (DEBUG) transactions = transactions.slice(0,100000);

		const output = [];
		let projId = 0;
		
		// Grab unique Project names
		let projNames = _.unique(_.pluck(transactions, 'aid'));
		
		for (let i  = 0; i < projNames.length; i++) {
				if (i % 1000 === 0) console.log('i = ' + i);
			// get current Project name ("aid" data field)
			const curProj_aid = projNames[i];

			// get all transactions associated with this project
			const projTrans = transactions.filter(d => d.aid === curProj_aid);

			// Grab unique recipient country codes
			let projCountryCodes = _.unique(_.pluck(projTrans, 'country_code'));

			// create project entry obj for each 'aid' and 'country_code' combo
			for (let j = 0; j < projCountryCodes.length; j++) {

				// Create new project for each recipient country
				const proj = {};

				// Get current country code (2-char)
				const curCountryCode = projCountryCodes[j];

				// Get transactions for this project 'aid' for this 'country_code'
				const projCountryTrans = projTrans.filter(d => d.country_code === curCountryCode);
				
				// project_id
				proj.project_id = 'proj.' + projId.toString();
				projId++;

				// grab the first transaction so we can reference its project-level data fields
				const firstProjTrans = projCountryTrans[0];

				// // DEBUG store aid data
				// proj.aid = firstProjTrans.aid;

				
				// project_function
				// get sector codes for this activity (project)
				const activities_for_proj = iatiActivities.filter(d => d.aid === firstProjTrans.aid);
				const curSectorCodes = _.unique(_.pluck(activities_for_proj, 'sector_code'));
				proj.project_function = App.getFunctionTags(curSectorCodes);
				
				// project_name
				proj.project_name = activities_for_proj[0].title;

				// project_disease
				proj.project_disease = App.getDiseaseTags(curSectorCodes);

				if (proj.project_function.length === 0) console.log(curSectorCodes);

				// donor_country
				const curDonorData = App.getDonorData(firstProjTrans.funder_ref);
				proj.donor_country = curDonorData.donor_country;

				// donor_sectors
				proj.donor_sector = curDonorData.donor_sector;

				// donor_name
				proj.donor_name = curDonorData.donor_name;

				// channel
				// placeholder

				// recipient_country
				const curRecipientData = App.getRecipientData(firstProjTrans.country_code); // TODO
				proj.recipient_country = curRecipientData.recipient_country;

				// recipient_sector
				proj.recipient_sector = curRecipientData.recipient_sector;

				// recipient_name
				proj.recipient_name = curRecipientData.recipient_name;

				// process transactions data
				proj.transactions = [];

				// transaction types to include
				const transactionTypes = [];

				for (let j = 0; j < projCountryTrans.length; j++) {
					const curTrans = {};

					// transactions[0].type
					curTrans.type = App.getTransType(projCountryTrans[j].trans_code);
					if (curTrans.type)
					
					// transactions[0].amount
					curTrans.amount = parseFloat(projCountryTrans[j].trans_usd) * parseFloat(projCountryTrans[j].country_percent) / 100.0;

					// transactions[0].cy
					curTrans.cy = Util.SqlDayToYYYY(projCountryTrans[j].trans_day);

					// transactions[0].currency
					curTrans.currency = 'USD'; // always USD for IATI data

					// add transaction if it's a non-zero amount, otherwise skip it
					const transactionAmountNullOrZero = curTrans.amount === null || curTrans.amount === 0.0 || curTrans.amount === undefined || isNaN(curTrans.amount);

					// skip transactions with null trans_day
					const transactionUnknownDay = projCountryTrans[j].trans_day === null;

					if (!transactionAmountNullOrZero && !transactionUnknownDay) proj.transactions.push(curTrans);
				}

				let someCommitments = false;
				let someSpent = false;
				
				proj.total_committed = 0.0;
				proj.total_spent = 0.0;
				proj.transactions.forEach(d => {
					if (d.type === "commitment") {
						someCommitments = true;
						proj.total_committed += d.amount;
					} else if (d.type === "disbursement" || d.type === "expenditure") {
						someSpent = true;
						proj.total_spent += d.amount;
					}
				});

				if (!someCommitments) proj.total_committed = null;
				if (!someSpent) proj.total_spent = null;

				// total_currency
				proj.total_currency = 'USD'; // always USD for IATI for now

				// source
				proj.source = {
					name: "IATI via D-Portal",
					id: curProj_aid,
					added_by: "Talus",
					mmddyyyy_added: "092817"
				};

				// if funds committed and spent are both null or zero, exclude the project
				// otherwise, add project to output
				const committedNullOrZero = proj.total_committed === null || proj.total_committed === 0.0;
				const spentNullOrZero = proj.total_spent === null || proj.total_spent === 0.0;
				if (!committedNullOrZero || !spentNullOrZero) output.push(proj);
			}
		}

		console.log(output);

		// tag each project with one or more JEE Core Capacities using the hash table
		// in Util.ccHash
		App.tagJeeCcs(output);

		Util.save(output, 'funding_data-iati_2014_plus-092717-v2-MV.json');
	};

	/* getData
	*  gets data from CSV file
	*/
	App.getData = (dataFn, callback) => {
		const xhr = new XMLHttpRequest();
		xhr.open('POST', '/getCsvData', true);
		xhr.responseType = 'application/json';
		xhr.setRequestHeader('Content-type', 'application/json');
		xhr.onload = function(e) {
			if (this.status == 200) {
				// console.log(JSON.parse(this.response)[0]);
				callback(JSON.parse(this.response)); // do stuff with the returned data
			}
			if (callback) callback(this.status);
		};
		xhr.send(JSON.stringify({
			dataFn: dataFn
		}));
	};


	/* translateBatch
	*  translates titles and descs in the activity data
	*/
	App.translateBatch = (text) => {

		const xhr = new XMLHttpRequest();
		xhr.open('POST', '/translateBatch', true);
		xhr.responseType = 'application/json';
		xhr.setRequestHeader('Content-type', 'application/json');
		xhr.onload = function(e) {
			if (this.status == 200) {
				// console.log(JSON.parse(this.response)[0]);
				const callback = console.log;
				App.translateBatchResult = this.response;
				// callback(this.response);
				// callback(JSON.parse(this.response)); // do stuff with the returned data
			}
			// if (callback) callback(this.status);
		};
		xhr.send(JSON.stringify({
			text: text
		}));
	};

	/* translateDescs
	*  translates titles and descs in the activity data
	*/
	App.translateDescs = () => {



		d3.queue()
				.defer(d3.json, './data/activity_descs.json')
				.await((error, data) => {



					getTranslationTitle = (i) => {
						console.log(i);
						if (i > data.length) return;
						if (data[i].title === null) {
							getTranslationTitle(i + 1);
							return;
						}
						App.translate(data[i].title, (result_tmp) => {
							result = JSON.parse(result_tmp);
							data[i].title_trns = result.text;
							data[i].title_lang = result.from.language.iso;
							getTranslationTitle(i + 1);
						});
						// App.translate(data[i].description, (result_tmp) => {
						// 	result = JSON.parse(result_tmp);
						// 	data[i].description_trns = result.text;
						// 	data[i].description_lang = result.from.language.iso;
						// 	console.log(n++);
						// });
					};

					App.translationResults = data;
					getTranslationTitle(0);

					
			});
	};


	/* translate
	*  gets translation of text and returns orig language ISO
	*/
	App.translate = (text, callback) => {
		const xhr = new XMLHttpRequest();
		xhr.open('POST', '/translate', true);
		xhr.responseType = 'application/json';
		xhr.setRequestHeader('Content-type', 'application/json');
		xhr.onload = function(e) {
			if (this.status == 200) {
				// console.log(JSON.parse(this.response)[0]);
				callback(this.response);
				// callback(JSON.parse(this.response)); // do stuff with the returned data
			}
			// if (callback) callback(this.status);
		};
		xhr.send(JSON.stringify({
			text: text
		}));
	};

	App.translateBatch2Results = [];

	// list of unique activities from latest data
	

	App.translateBatch2 = (i) => {
		if (i % 100 === 0) console.log('i = ' + i);
		if (i >= iatiActivitiesUniqueAid.length) return;
		// if current iati activity has a translation available, use it and move on
		const curAct = iatiActivitiesUniqueAid[i];
		const transMatch = translatedDescs.find(d => d.aid === curAct);
		if (transMatch !== undefined) {
			curAct.desc_trns = transMatch.desc_trns;
			App.translateBatch2Results.push({aid: curAct, desc_trns: transMatch.desc_trns});
			App.translateBatch2(i + 1);
		} else {
			// do translation
			const curActObj = iatiActivities.find(d => d.aid === curAct);
			if (curActObj.description === null || curActObj.description.length > 4000) {
				// curAct.desc_trns = null;
				App.translateBatch2(i + 1);
			} else {
				App.translate(curActObj.description, (result) => {
					// console.log(result);
					// curAct.desc_trns = result;
					App.translateBatch2Results.push({aid: curAct, desc_trns: result});
					App.translateBatch2(i + 1);
				});
			}
		}
		// otherwise, perform the translation on its description and add it
	}; 

	// translate each Project name
	App.translateProjectNames = (i, projectNames) => {
		console.log(i);
		if (i >= projectNames.length || projectNames[i] === null) return;
		console.log(projectNames[i])
		App.translate(projectNames[i], (eng_name) => {
			projectNames[i] = eng_name;
			App.translateProjectNames(i + 1, projectNames);
		});
	};

	// function to calculate the amount spent and disbursed by year for a project
	App.getFundsByYear = (project) => {
		const transactions = project.transactions;
		const spendTrans = transactions.filter(d => { return d.type === "disbursement" || d.type === "expenditure"; });
		const commitmentTrans = transactions.filter(d => { return d.type === "commitment"; });
		
		project.total_spent = 0.0;
		project.total_committed = 0.0;
		// const curYear = new Date().getFullYear();
		const curYear = 2017;
		const minYear = 2014;

		project.spent_by_year = {
			2014: 0.0,
			2015: 0.0,
			2016: 0.0,
			2017: 0.0
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
			2017: 0.0
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
	};

	// function to process article x data
	App.processArticleXData = () => {
		// load article X JSON
		d3.queue()
			.defer(d3.json, './data/article_x_temp.json')
			.defer(d3.json, './data/funding_data_v13.json')
			.await((error, articleXData, currentData) => {
				if (error) throw error;
				// get project number to start with
				let n = 29992;

				// setup output array for new data to add
				newProjArr = [];

				// tag for JEE CCs
				articleXData.forEach(project => {

					// description
					const descCcs = App.searchForJeeCcs(project.project_description);

					// title
					const titleCcs = App.searchForJeeCcs(project.project_title);

					// tag them
					const ccs = _.union(descCcs, titleCcs);

					// get num of donors, recipients, and years
					const n_donor = project.implementing_country.length;
					const n_recipient = project.partner_country.length;
					const yearArr = project.project_duration.split(' - ');
					const n_years = (yearArr.length === 1) ? 1 : (parseInt(yearArr[1]) - parseInt(yearArr[0]) + 1);

					// FOR EACH DONOR
					project.implementing_country.forEach(donor => {
						
						// get donor info
						const donor_name = donor;
						const donor_country_json = countries_json.find(d => d.NAME == donor_name);
						const donor_country = donor_country_json.ISO2;
						const donor_sector = 'Government';

						// FOR EACH RECIPIENT:
						project.partner_country.forEach(recipient => {
							
							// get recipient info
							const recipient_sector = 'Country';
							let recipient_name, recipient_country;
							if (recipient === "General") {
								// TODO
								recipient_name = "General";
								recipient_country = "General";
							} else if (recipient === "Kosovo") {
								recipient_name = recipient;
								recipient_country = "XK";
							} else {
								const recipient_country_json = countries_json.find(d => d.NAME == recipient);
								console.log(recipient+ ':')
								console.log(recipient_country_json)
								recipient_country = recipient_country_json.ISO2;
								recipient_name = recipient;
							}

							// setup new project data
							let newProj = {};

							// // make function and disease 'unspecified'
							// newProj.project_function = [
							//     {
							//       "p": "Unspecified",
							//       "c": null
							//     }
							//   ];
							// newProj.project_disease = [
							//     {
							//       "p": "Unspecified",
							//       "c": null
							//     }
							//   ];

							// project_name
							newProj.project_name = project.project_title;
							
							// project_description
							newProj.project_desc = project.project_description;

							// core_capacities
							newProj.core_capacities = project.core_capacities;
							

							// donor_sector
							newProj.donor_sector = 'Government';

							// donor_country
							newProj.donor_code = donor_country;
							
							// donor_name
							newProj.donor_name = donor_name;

							// recipient_sector
							newProj.recipient_sector = 'Country';

							// recipient_country
							newProj.recipient_country = recipient_country;
							
							// recipient_name
							newProj.recipient_name = recipient_name;

							// convert from currency in project_value_iso to USD
							// load exchange rates from json
							// get needed exchange rate per year and country code
							// convert amount to contemporary USD
							// TODO
							const amountOrig = project.project_value_amount;
							const amountUsd = Util.convertToUsd(amountOrig, project.project_value_iso, project.project_value_year);
							
							if (project.project_title !== "ViroRed") {

								// Add initial commitment
								const initCommitAmount = amountUsd / (n_donor + n_recipient);
								const initCommitYear = parseInt(yearArr[0]);
								newProj.transactions = [];
								newProj.transactions.push({
									type: 'commitment',
									amount: initCommitAmount,
									cy: initCommitYear,
									currency: 'USD'
								});

								const annualSpendAmount = initCommitAmount / (n_years);
								for (let i = 0; i < n_years; i++) {
									const curSpendYear = initCommitYear + i;
									newProj.transactions.push({
										type: 'disbursement',
										amount: annualSpendAmount,
										cy: curSpendYear,
										currency: 'USD'
									});
								}
							} else {

								// Add commitments and disbursements each year
								const initCommitYear = parseInt(yearArr[0]);
								const annualSpendAmount = amountUsd / (n_years + n_donor + n_recipient);
								newProj.transactions = [];
								for (let i = 0; i < n_years; i++) {
									const curSpendYear = initCommitYear + i;
									newProj.transactions.push({
										type: 'commitment',
										amount: annualSpendAmount,
										cy: curSpendYear,
										currency: 'USD'
									});
									newProj.transactions.push({
										type: 'disbursement',
										amount: annualSpendAmount,
										cy: curSpendYear,
										currency: 'USD'
									});
								}
							}

							// increment project id
							n = n + 1;
							newProj.project_id = 'proj.' + n;

							// add core capacities
							newProj.core_capacities = ccs;

							// calc total spent and committed by year
							App.getFundsByYear(newProj);

							// total-currency
							newProj.total_currency = 'USD';

							// total_spent
							newProj.source = {
							    "name": "GP BTWC Article X Assistance Compendium 2017",
							    "id": "",
							    "added_by": "Talus",
							    "mmddyyyy_added": "01032018"
							  };

							// append data to newProjArr
							newProjArr.push(newProj);
						});
					});
				});

				// append new projects to existing data
				currentData = currentData.concat(newProjArr);

				// retag all CCs
				App.tagJeeCcs(currentData);
				// console.log(articleXData);
				console.log(currentData)
				// console.log(newProjArr);

				// // save out updated data
				// Util.save(currentData,'funding_data_v13.json');
				App.updatedData = currentData;
			});

	};

})();