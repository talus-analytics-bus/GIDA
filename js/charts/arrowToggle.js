(() => {
	const fundingColor = '#597251';
	const recipientColor = '#623B63';

	class ArrowToggle extends Chart {
		constructor(selector, params = {}) {
			super(selector, params);

			this.svg.style('overflow', 'visible');

			this.fundingColor = fundingColor;
			this.recipientColor = recipientColor;

			this.funderCallback = () => {};
			this.recipientCallback = () => {};

			this.setupDefs();

			this.normalTextWeight = 300;
			this.selectedTextWeight = 500;
			this.normalTextColor = "#cccccc";
			this.selectedTextColor = "white";

			this.state = params.default || 'funded';

			this.init();
		}

		setupDefs() {
			// http://bl.ocks.org/cpbotha/5200394
			this.newDef('dropShadow', 'filter')
				.attr('x', '-50%')
				.attr('y', '-50%')
				.attr('width', '200%')
				.attr('height', '200%');

			this.defs
				.dropShadow
				.append('feGaussianBlur')
				.attr('in', 'SourceAlpha')
				.attr('stdDeviation', 2)
				.attr('result', 'blur');

			const r = 39 / 251;
			const g = 84 / 251;
			const b = 128 / 251;
			const darkShadow = `
				0 0 0 0 ${r} 
				0 0 0 0 ${g} 
				0 0 0 0 ${b} 
				0 0 0 1 0 
			`;
			this.defs
				.dropShadow
				.append('feColorMatrix')
				.attr('in', 'blur')
				.attr('result', 'matrixOut')
				.attr('values', darkShadow);

			const merge = this.defs
				.dropShadow
				.append('feMerge');

			merge.append('feMergeNode')
				.attr('in', 'matrixOut');
			merge.append('feMergeNode')
				.attr('in', 'SourceGraphic');

			this.newDef('toWhite', 'filter')
				.append('feColorMatrix')
				.attr('in', 'SourceGraphic')
				.attr('values', `
				1 0 0 0 1 
				0 1 0 0 1 
				0 0 1 0 1 
				0 0 0 1 0 
			`)
		}

		registerFunderCallback(callback) {
			this.funderCallback = callback;
		}

		registerRecipientCallback(callback) {
			this.recipientCallback = callback;
		}

		draw() {
			this.drawFundingButton();
			this.drawReceivingButton();
			this.toggle(this.state);
		}

		drawFundingButton() {
			this.newGroup('funding')
				.append('path')
				.attr('d', this.getFundingPath())
				.style('fill', this.fundingColor)
				.on('click', () => this.toggle('funded'));

			this.newGroup('label', this.funding)
				.attr('transform', 'translate(7, 22)')
				.append('text')
				.style('stroke', 'none')
				.style('fill', this.normalTextColor)
				.style('text-transform', 'uppercase')
				.style('font-size', '16px')
				.style('pointer-events', 'none')
				.style('font-weight', this.normalTextWeight)
				.text('$ Funder')
		}

		getFundingPath() {
			return "M3.52,30.29A2.77,2.77,0,0,1,.76,27.52v-24A2.77,2.77,0,0,1,3.52.76H91.75A4.92,4.92,0,0,1,94.2,1.93a.3.3,0,0,1,.08.08l11.38,12.31a.76.76,0,0,1,0,1L94.09,29a2.77,2.77,0,0,1-2.34,1.32Z";
		}

		drawReceivingButton() {
			this.newGroup('receiving')
				.attr('transform', `translate(100)`)
				.append('path')
				.attr('d', this.getReceivingPath())
				.style('fill', this.recipientColor)
				.on('click', () => this.toggle('received'));

			this.newGroup('label', this.receiving)
				.attr('transform', 'translate(16, 22)')
				.append('text')
				.style('stroke', 'none')
				.style('fill', this.normalTextColor)
				.style('text-transform', 'uppercase')
				.style('font-size', '16px')
				.style('pointer-events', 'none')
				.style('font-weight', this.normalTextWeight)
				.text('$ Recipient')
		}

		getReceivingPath() {
			return "M2.22,30.07a.71.71,0,0,1-.55-1.14L12.55,15.27c.11-.11.14-.18.14-.24a.28.28,0,0,0-.09-.18L1.09,2l0,0A.72.72,0,0,1,.71,1.3.71.71,0,0,1,1.25.73c.1,0,.1,0,5.21,0C29.11.7,120,.78,120,.78a2.54,2.54,0,0,1,1.8.75,2.57,2.57,0,0,1,.75,1.8l0,24.31A2.55,2.55,0,0,1,120,30.19Z";
		}

		toggle(to=undefined) {
			const switchToFunded = () => {
				this.state = 'funded';

				this.chart
					.selectAll('path')
					.style('filter', null);

				this.chart
					.selectAll('.label text')
					.style('font-weight', this.normalTextWeight)
					.style('fill', this.normalTextColor);

				this.funding
					.selectAll('path')
					.style('filter', 'url(#dropShadow)');

				this.funding
					.selectAll('.label text')
					.style('font-weight', this.selectedTextWeight)
					.style('fill', this.selectedTextColor);

				this.funderCallback();
			};

			const switchToReceived = () => {
				this.state = 'received';

				this.chart
					.selectAll('path')
					.style('filter', null);

				this.chart
					.selectAll('.label text')
					.style('font-weight', this.normalTextWeight)
					.style('fill', this.normalTextColor);

				this.receiving
					.selectAll('path')
					.style('filter', 'url(#dropShadow)');

				this.receiving
					.selectAll('.label text')
					.style('font-weight', this.selectedTextWeight)
					.style('fill', this.selectedTextColor);

				this.recipientCallback();
			};

			if (to === 'received' || (to === undefined && this.state === 'funded')) {
				switchToReceived();
			} else if (to === 'funded' || (to === undefined && this.state === 'received')) {
				switchToFunded()
			}
		}
	}

	App.newToggle = (selector,
					 params = {},
					 funderCallback = (() => {
						 console.log('Switched to funder')
					 }),
					 recipientCallback = (() => {
						 console.log('Switched to recipient')
					 }),) => {

		const toggle = new ArrowToggle(
			selector,
			Object.assign(
				{
					margin: {
						top: 10,
						bottom: 10,
						left: 10,
						right: 10,
					}
				},
				_.clone(params)
			)
		);

		toggle.registerFunderCallback(funderCallback);
		toggle.registerRecipientCallback(recipientCallback);

		return toggle;
	};

	const smallFunder = "M2.5,25.75A2.25,2.25,0,0,1,.25,23.5V2.5A2.25,2.25,0,0,1,2.5.25H17.72a.24.24,0,0,1,.21.11l8.42,12.9a.26.26,0,0,1,0,.29l-9.42,12.1a.26.26,0,0,1-.2.1Z";

	const smallReceiver = "M.5,25.75a.23.23,0,0,1-.22-.14.22.22,0,0,1,0-.26L9.48,13.5l-.35-.58C8,11.06,4.53,6,2.44,3,.75.6.75.6.75.5A.25.25,0,0,1,1,.25H24.73a1.34,1.34,0,0,1,1.34,1.34V24.41a1.34,1.34,0,0,1-1.34,1.34Z";

	const newIcon = (selector, type) => {
		let pathData, color, offset, thead;
		switch(type) {
			case 'fund':
				pathData = smallFunder;
				color = fundingColor;
				offset = 5;
				thead = '.fund-col-name > .head-text';
				break;
			default:
				pathData = smallReceiver;
				color = recipientColor;
				offset = 12;
				thead = '.receive-col-name > .head-text';
				break;
		}
		const icon = d3.selectAll(selector)
			.append('svg')
			.style('position', 'absolute')
			.style('top', '6px')
			.style('left', `${$(thead).width() + 15}px`)
			.attr('width', '30px')
			.attr('height', '30px');
		icon.append('path')
			.attr('d', pathData)
			.style('fill', color)
			.style('stroke', 'white')
			.style('stroke-width', '1px');
		icon.append('text')
			.attr('transform', `translate(${offset}, 19)`)
			.style('font-size', '16px')
			.style('stroke', 'none')
			.style('fill', 'white')
			.text('$');
		return icon
	};

	App.fundIcon = (selector) => newIcon(selector, 'fund');
	App.receiveIcon = (selector) => newIcon(selector, 'receive');

})();

