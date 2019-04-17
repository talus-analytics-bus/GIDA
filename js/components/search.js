(() => {
	App.initCountrySearchBar = (selector, searchedFn, param = {}) => {
		// timeout for country search
		let liveSearchTimeout;
		const numResultsToDisplay = 3;
		let results = [];
		let activeResultNum = -1;


		// define jquery elements
		const $container = $(selector);
		const $input = $container.find('input');
		const $resultsBox = $container.find('.live-search-results-container');
		if (App.usingFirefox && $resultsBox.hasClass('reverse')) {
			$resultsBox.css('top','-160px');
			// $resultsBox.css('top','-124px');
		}
		if (param.topLayout) $resultsBox.addClass('top-layout');
		else $resultsBox.addClass('bottom-layout');
		const isReverse = param.isReverse === true;
		const down = isReverse ? 38 : 40;
		const up = isReverse ? 40 : 38;
		// set search bar behavior
		$input
			.on('focus', function focus() {
				searchForCountry($(this).val());
			})
			.on('blur', hideSearch)
			.on('keyup', function keyUp(ev) {
				clearTimeout(liveSearchTimeout);
				const searchVal = $(this).val();
				if (ev.which === 13) {
					// enter: perform search immediately
					if (activeResultNum >= 0) {
						$(selector).val('');
						hideSearch();
						searchedFn(results[activeResultNum]);
					} else {
						searchForCountry(searchVal);
					}
				} else if (ev.which === 27) {
					// escape key: blur
					hideSearch();
				} else if (ev.which === down) {
					// down arrow: scroll for search results
					if (activeResultNum < numResultsToDisplay - 1) {
						activeResultNum++;
						highlightResultBox();
					}
				} else if (ev.which === up) {
					// up arrow: scroll for search results
					if (activeResultNum > -1) {
						activeResultNum--;
						highlightResultBox();
					}
				} else {
					// perform search when user stops typing for 250ms
					liveSearchTimeout = setTimeout(() => {
						searchForCountry(searchVal);
					}, 250);
				}
			});

		// define domain
		const countries = App.countries.slice(0);
		// if (param.includeNonCountries) {
		// 	App.codeToNameMap.entries().forEach((d) => {
		// 		if (!App.countries.find(c => c.ISO2 === d.key)) {
		// 			countries.push({
		// 				ISO2: d.key,
		// 				ISO3: d.key,
		// 				NAME: d.value,
		// 			});
		// 		}
		// 	});
		// }

		// initialize search engine
		const fuse = new Fuse(countries, {
			shouldSort: true,
			threshold: 0.5,
			distance: 100,
			includeScore: true,
			keys: ['ISO2', 'ISO3', 'NAME'],
		});

		// function for displaying country search results
		function searchForCountry(searchVal) {
			// hide if nothing in search bar
			if (searchVal.trim() === '') {
				$resultsBox.hide();
				return;
			}

			// reset highlighted search box
			activeResultNum = -1;
			highlightResultBox();

			// search for results
			results = fuse.search(searchVal);

			// weight score by population slightly
			results.forEach((r) => {
				const popLog = r.item.POP2005 ? Math.log10(r.item.POP2005) : 0;
				r.score -= 0.02 * popLog;
			});
			Util.sortByKey(results, 'score');

			// show results in boxes under search input
			$resultsBox.show();
			if (results.length === 0) {
				$resultsBox.find('.live-search-no-results-text').show();
				$resultsBox.find('.live-search-results-contents').hide();
			} else {
				$resultsBox.find('.live-search-no-results-text').hide();
				$resultsBox.find('.live-search-results-contents').show();

				let boxes = d3.select($resultsBox[0])
					.select('.live-search-results-contents')
					.selectAll('.live-search-results-box')
						.data(results.slice(0, numResultsToDisplay));
				boxes.exit().remove();

				const newBoxes = boxes.enter().append('div')
					.attr('class', 'live-search-results-box');
				newBoxes.append('div')
					.attr('class', 'live-search-results-title');
				newBoxes.append('div')
					.attr('class', 'live-search-results-subtitle');

				boxes = boxes.merge(newBoxes).on('mousedown', (d) => {
					// clear input
					$(selector).val('');

					// call searched function
					searchedFn(d.item);
				});
				boxes.select('.live-search-results-title')
					.text((d) => {
						if (d.item.POP2005) return `${d.item.NAME} (${d.item.ISO2})`;
						return d.item.NAME;
					});
				boxes.select('.live-search-results-subtitle')
					.style('display', d => (d.item.POP2005 ? 'block' : 'none'))
					.html(d => `Population: ${Util.comma(d.item.POP2005)}`);
			}
		}

		// colors the search result selected
		function highlightResultBox() {
			$resultsBox.find('.live-search-results-box').removeClass('active');
			if (activeResultNum > -1) {
				const childNum = activeResultNum + 1;
				$resultsBox
					.find(`.live-search-results-box:nth-child(${childNum})`)
					.addClass('active');
			}
		}

		function hideSearch() {
			clearTimeout(liveSearchTimeout);
			$resultsBox.hide();
		}
	};
})();
