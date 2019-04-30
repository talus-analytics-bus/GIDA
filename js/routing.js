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
			console.log(e)
			const name = e.id.replace('-template', '');
			partials[name] = Handlebars.registerPartial(name, $(e).html());
			console.log(Handlebars.registerPartial(name, $(e).html()))
			console.log(partials[name])
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
			$('#theme-toggle').bootstrapToggle('enable');
			$('#theme-toggle').bootstrapToggle('on');
			loadPage('map', App.initMap);
		});
		crossroads.addRoute('/map/{tabSelect}', (tabSelect) => {
			$('#theme-toggle').bootstrapToggle('enable');
			$('#theme-toggle').bootstrapToggle('on');
			loadPage('map', App.initMap, tabSelect);
		});
		// crossroads.addRoute('/', () => {
		// 	loadPage('landing', App.initLanding, 'country');
		// });
		crossroads.addRoute('/', () => {
			$('#theme-toggle').bootstrapToggle('enable');
			loadPage('home', App.initHome);
		});
		crossroads.addRoute('/analysis', () => {
			$('#theme-toggle').bootstrapToggle('enable');
			loadPage('analysis', App.initAnalysis, 'network');
		});
		crossroads.addRoute('/analysis/country', () => {
			$('#theme-toggle').bootstrapToggle('enable');
			loadPage('analysis', App.initAnalysis, 'country');
		});
		crossroads.addRoute('/analysis/{iso}', (iso) => {
			$('#theme-toggle').bootstrapToggle('off');
			$('#theme-toggle').bootstrapToggle('disable');
			loadPage('analysis-country', App.initAnalysisCountry, iso);
		});
		crossroads.addRoute('/analysis/{iso}/d', (iso) => {
			$('#theme-toggle').bootstrapToggle('off');
			$('#theme-toggle').bootstrapToggle('disable');
			loadPage('analysis-country', App.initAnalysisCountry, iso, 'd');
		});
		crossroads.addRoute('/analysis/{iso}/r', (iso) => {
			$('#theme-toggle').bootstrapToggle('off');
			$('#theme-toggle').bootstrapToggle('disable');
			if (iso !== 'ghsa') {
				loadPage('analysis-country', App.initAnalysisCountry, iso, 'r');
			} else {
				hasher.setHash('analysis/ghsa/d');
			}
		});
		crossroads.addRoute('/analysis/{iso}/{type}/table', (iso, type) => {
			$('#theme-toggle').bootstrapToggle('off');
			$('#theme-toggle').bootstrapToggle('disable');
			loadPage('analysis-table', App.initAnalysisTable, iso, type);
		});
		crossroads.addRoute('/analysis/{fundIso}/{recIso}', (fundIso, recIso) => {
			$('#theme-toggle').bootstrapToggle('off');
			$('#theme-toggle').bootstrapToggle('disable');
			loadPage('analysis-pair', App.initAnalysisPair, fundIso, recIso);
		});
		crossroads.addRoute('/submit', () => {
			$('#theme-toggle').bootstrapToggle('enable');
			loadPage('submit', App.initSubmit);
		});
		crossroads.addRoute('/glossary', () => {
			$('#theme-toggle').bootstrapToggle('enable');
			loadPage('glossary');
		});
		crossroads.addRoute('/settings', () => {
			$('#theme-toggle').bootstrapToggle('enable');
			loadPage('settings', App.initSettings);
		});
		crossroads.addRoute('/about/{tab_name}', (tab_name) => {
			$('#theme-toggle').bootstrapToggle('enable');
			const context = {
				background: tab_name === 'background',
				data: tab_name === 'data',
				research: tab_name === 'research',
			};
			loadPage('about', App.initAbout, context);
		});

		crossroads.addRoute('/data', () => {
			$('#theme-toggle').bootstrapToggle('enable');
			loadPage('data', App.initData);
		});

		// setup hasher for subscribing to hash changes and browser history
		hasher.prependHash = '';
		hasher.initialized.add(parseHash);
		hasher.changed.add(parseHash);
		hasher.init();
	};

	function loadPage(pageName, func, ...data) {
		let navName = pageName;
		// let navName = pageName.split('-')[0];
		if (pageName === "landing") {
			navName = "";
		}

		// set nav
		$('nav li').removeClass('active');
		$(`nav li[page="${navName}"]`).addClass('active');
		// load page
		loadTemplate(pageName, data);
		if (func) func(...data);
		window.scrollTo(0, 0);
		if (App.currentTheme === 'light') {
			$('#theme-toggle').bootstrapToggle('off');
		} else {
			$('#theme-toggle').bootstrapToggle('on');
		}

		$('button.ghsa-button').click(() => {
			hasher.setHash('analysis/ghsa/d');
		});

	}
	function parseHash(newHash) { crossroads.parse(newHash); }
	function loadTemplate(page, data) {
		$('#page-content').html(templates[page](data[0]));
	}
})();
