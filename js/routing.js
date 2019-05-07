const Routing = {};

(() => {
	const templates = {};
	const partials = {};
	Routing.templates = templates;
	const tooltipTemplates = {};

	const hbTemplates = [
		'home',
		'data',
		'about',
		'analysis-country',
		'analysis-pair',
		'analysis-table',
		'analysis',
		'glossary',
		'landing',
		'map',
		'settings',
		'submit',
		'tooltip-fr',
	]; // Add the name of the new template here
	const hbPartials = [
		'background',
		'data',
		'research',
	]; // Add name of new partial here
	const hbDirectory = 'templates/'; // Don't touch
	const hbFileSuffix = '.hbs'; // Don't touch


	// Logic: 	1) Load the handlebar templates from disk
	//			2) Precompile the templates
	//			3) Initialize the routes
	//		Now the handlebar templates / partials are able to be used.
	//
	//
	// The template compilation will happen once all of the handlebar templates are loaded into body.
	//
	Routing.prepareHandlebarPartials = (callback) => {

		if (hbPartials.length === 0) {
			if (callback) {
				callback()
			} else {
				return;
			}
		}

		let hbCount = 0; // This is the counter.
		hbPartials.forEach((d) => {
			$.ajax({
				url: `${hbDirectory}${d}-partial${hbFileSuffix}`,
				cache: false,
				success: function (data, status, error) {
					source = data;
					$('body').append(data);
					hbCount++;
					if (hbCount === hbPartials.length) Routing.registerPartials(callback);
				},
				error: function (data, status, error) {

					// ToDo write the error handler details here
				},
			});
		});
	};

	Routing.prepareHandlebarTemplates = (callback) => {
		let count = 0; // This is the counter.
		hbTemplates.forEach((d) => {
			$.ajax({
				url: `${hbDirectory}${d}-template${hbFileSuffix}`,
				cache: true,
				success: function (data, status, error) {
					source = data;
					$('body').append(data);
					count++;
					if (count === hbTemplates.length) Routing.precompileTemplates(callback);
				},
				error: function (data, status, error) {
					// ToDo write the error handler details here
				},
			});
		});
	};

	Routing.prepareHandlebar = () => {
		Routing.prepareHandlebarPartials(() => {
			Routing.prepareHandlebarTemplates(() => {
				Routing.initializeRoutes();
			});
		});
	};

	Routing.precompileTemplates = (callback) => {
		$("script[type='text/x-handlebars-template']").each((i, e) => {
			templates[e.id.replace('-template', '')] = Handlebars.compile($(e).html());
		});
		$("script[type='text/x-handlebars-tooltip-template']").each((i, e) => {
			tooltipTemplates[e.id.replace('-template', '')] = Handlebars.compile($(e).html());
		});
		Routing.tooltipTemplates = tooltipTemplates;

		if (callback) {
			callback();
		}
	};

	Routing.registerPartials = (callback) => {
		$("script[type='text/x-handlebars-partial']").each((i, e) => {
			const name = e.id.replace('-template', '');
			partials[name] = Handlebars.registerPartial(name, $(e).html());
		});

		if (callback) {
			callback();
		}
	};

	Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
		return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
	});

	crossroads.ignoreState = true;
	Routing.initializeRoutes = () => {
		// setup crossroads for routing
		crossroads.addRoute('/map', () => {
			loadPage('map', App.initMap);
		});
		crossroads.addRoute('/map/{tabSelect}', (tabSelect) => {
			loadPage('map', App.initMap, tabSelect);
		});
		crossroads.addRoute('/map/{tabSelect}/{indTypeParam}', (tabSelect, indTypeParam) => {
			loadPage('map', App.initMap, tabSelect, indTypeParam);
		});
		// crossroads.addRoute('/', () => {
		// 	loadPage('landing', App.initLanding, 'country');
		// });
		crossroads.addRoute('/', () => {
			loadPage('home', App.initHome);
		});
		crossroads.addRoute('/analysis', () => {
			loadPage('analysis', App.initAnalysis, 'network');
		});
		crossroads.addRoute('/analysis/country', () => {
			loadPage('analysis', App.initAnalysis, 'country');
		});
		crossroads.addRoute('/analysis/{iso}', (iso) => {
			loadPage('analysis-country', App.initAnalysisCountry, iso);
		});
		crossroads.addRoute('/analysis/{iso}/d', (iso) => {
			loadPage('analysis-country', App.initAnalysisCountry, iso, 'd');
		});
		crossroads.addRoute('/analysis/{iso}/r', (iso) => {
			if (iso !== 'ghsa') {
				loadPage('analysis-country', App.initAnalysisCountry, iso, 'r');
			} else {
				hasher.setHash('analysis/ghsa/d');
			}
		});
		crossroads.addRoute('/analysis/{iso}/{type}/table', (iso, type) => {
			loadPage('analysis-table', App.initAnalysisTable, iso, type);
		});
		crossroads.addRoute('/analysis/{fundIso}/{recIso}', (fundIso, recIso) => {
			loadPage('analysis-pair', App.initAnalysisPair, fundIso, recIso);
		});
		crossroads.addRoute('/submit', () => {
			loadPage('submit', App.initSubmit);
		});
		crossroads.addRoute('/glossary', () => {
			loadPage('glossary');
		});
		crossroads.addRoute('/settings', () => {
			loadPage('settings', App.initSettings);
		});
		crossroads.addRoute('/about/{tab_name}', (tab_name) => {
			if (tab_name === 'submit') {
				loadPage('submit', App.initSubmit);
			} else {
				const context = {
					background: tab_name === 'background',
					data: tab_name === 'data',
					research: tab_name === 'research',
				};
				loadPage('about', App.initAbout, context);
			}
		});

		crossroads.addRoute('/data', () => {
			loadPage('data', App.initData);
		});

		// setup hasher for subscribing to hash changes and browser history
		hasher.prependHash = '';
		hasher.initialized.add(parseHash);
		hasher.changed.add(parseHash);
		hasher.init();
	};

	function loadPage(pageName, func, ...data) {
		if (pageName === 'map') {
			$('body > div.toggle, .toggleForPrint').css('visibility', 'visible');
			$('#theme-toggle').bootstrapToggle('on');
		} else {
			$('body > div.toggle, .toggleForPrint').css('visibility', 'hidden');
			$('#theme-toggle').bootstrapToggle('off');
		}
		let navName = pageName;
		// let navName = pageName.split('-')[0];
		if (pageName === "landing") {
			navName = "";
		} else if (pageName === 'submit') {
			navName = 'about';
		}

		// set nav
		$('nav li').removeClass('active');
		$(`nav li[page="${navName}"]`).addClass('active');
		$('.menu-dropdown').hide();

		// load page
		loadTemplate(pageName, data);
		if (func) func(...data);
		window.scrollTo(0, 0);
		// if (App.currentTheme === 'light') {
		// 	$('body > div.toggle').bootstrapToggle('off');
		// } else {
		// 	$('body > div.toggle').bootstrapToggle('on');
		// }

		$('button.ghsa-button').click(() => {
			hasher.setHash('analysis/ghsa/d');
		});

	}
	function parseHash(newHash) {
		crossroads.parse(newHash);
	}
	function loadTemplate(page, data) {
		const containerClass = page === 'map' ? 'container-fluid wide' : 'container';
		$('.navbar').toggleClass('wide', page === 'map');
		const context = {
			...data[0],
			containerClass: containerClass,
		};
		$('#page-content').html(templates[page](context));
	}
})();
