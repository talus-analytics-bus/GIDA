class Chart {
	constructor(selector, params={}) {
		$(selector).empty();

		this.selector = selector;

		this.containerwidth = $(selector).width();
		this.containerheight = $(selector).height();

		this.svg = d3.selectAll(selector)
			.append('svg')
			.attr('preserveAspectRatio', 'xMinYMin meet')
			.attr('viewBox', `${params.shiftX || 0} ${params.shiftY} ${this.containerwidth} ${this.containerheight + 50}`);

		this.params = params;
		this.margin = this.params.margin || {
			top: 0,
			bottom: 0,
			left: 0,
			right: 0,
		};

		this.width = this.containerwidth - this.margin.left - this.margin.right;
		this.height = this.containerheight - this.margin.top - this.margin.bottom;

		this.dimensions = this.params.dimensions || {
			width: undefined,
			height: undefined,
		};

		this.defs = this.svg.append('defs');

		this.chart = this.svg
			.append('g')
			.classed('chart', true)
			.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
	}

	get selected() {
		return $(this.selector);
	}

	/* API METHODS */
	plotAxes() {
		this.newGroup('axes');

		const xAxis = d3.axisBottom(this.xScale)
			.ticks(this.day.length);

		this.axes
			.append('g')
			.classed('x-axis', true)
			.attr('transform', `translate(0, ${this.height})`)
			.call(xAxis);

		const yAxis = d3.axisLeft(this.yScale)
			.tickSize(-this.width)
			.tickPadding(8)
			.ticks(4);

		const yAxisG = this.axes
			.append('g')
			.classed('y-axis', true)
			.style('stroke-opacity', 0.25)
			.call(yAxis);

		// this is dumb https://bl.ocks.org/mbostock/3371592
		yAxisG.select('.domain').remove();
	}

	newGroup(name, parent=undefined) {
		if (parent) {
			parent.selectAll(`.${name}`).remove();
			parent[name] = parent
				.append('g')
				.classed(name, true);
			return parent[name];
		} else {
			this.chart.selectAll(`.${name}`).remove();
			this[name] = this.chart
				.append('g')
				.classed(name, true);
			return this[name];
		}
	}

	subGroup(parent, name) {
		return this.newGroup(name, parent);
	}

	newDef(id, type) {
		d3.selectAll(`#${id}`).remove();
		$(`#${id}`).remove();

		this.defs[id] = this.defs
			.append(type)
			.attr('id', id);

		return this.defs[id];
	}

	ylabel(text) {
		const bbox = this.getBBox(this.axes.yAxis);
		this.newGroup('ylabelgroup');
		this.ylabelgroup
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', bbox.x - bbox.width)
			.attr('x', -this.height / 2)
			.style('text-anchor', 'middle')
			.text(text);
	}
	xlabel(text) {
		// const bbox = this.getBBox(this.axes.xAxis);
		this.newGroup('xlabelgroup');
		this.xlabelgroup.append('text')
			.attr('x', this.width / 2)
			.attr('y', this.height + 50)
			.style('text-anchor', 'middle')
			.text(text);
	}

	initSizing() {
		// initialize sizing
		onResize(this);

		// event listener
		// https://css-tricks.com/snippets/jquery/done-resizing-event/
		let timer;
		window.addEventListener('resize', () => {
			clearTimeout(timer);
			timer = window.setTimeout(() => {
				onResize(this);
			}, 250);
		});
	}

	init() {
		this.draw();
	}

	getBBox(element) {
		const svgBox = this.chart.node().getBoundingClientRect();
		const bbox = element.node().getBoundingClientRect();

		return {
			x: bbox.x - svgBox.x,
			y: bbox.y - svgBox.y,
			width: bbox.width,
			height: bbox.height,
		};
	}

	/* CURRENT PROJECT SPECIFIC METHODS */
}

function generateRoundedCorner(x, y, r) {
	const cornerDifference = Math.sin(Math.PI / 4) * r;

	const [ x1, y1 ] = [ x - cornerDifference, y ];
	const [ x2, y2 ] = [ x, y + cornerDifference ];

	// const path = d3.path();
	// path.moveTo(x1, y2);
	// path.arc(x1, y2, r, 0, Math.PI / 2);

	return {
		x1, y1, x2, y2,
		// pathString: path.toString(),
	};
}

class Path {
	constructor() {
		this.pathString = '';
		this.points = [];

		this.commands = {
			close: 'z',
			Move: 'M',
			move: 'm',
			Line: 'L',
			line: 'l',
			hLine: 'h',
			vLine: 'v',
			Curve: 'C',
			curve: 'c',
		};

		Object.keys(this.commands).forEach(k => {
			this[k] = (...args) => this.pathFunc(this.commands[k], ...args);
		});
	}

	toString() {
		return this.pathString;
	}

	pathFunc(letter, ...args) {
		this.points = this.points.concat([args]);
		this.pathString += `${letter}${args.join(',')}`;
		return this;
	}

	arc(r, a1, a2) {
		return this.pathFunc('a', r, r, 0, 0, 1, a1, a2);
	}
}
