(() => {
	/**
	 * Populates Core Capacity dropdown multiselect.
	 * @param  {string} selector   Selector to target
	 * @param  {Object} [param={}] parameters
	 */
	App.populateCcDropdown = (selector, param = {}) => {
		const emptyObj = { id: '', name: 'None - No core capacity tagged' };
		const capacities = App.capacities.concat(emptyObj);
		if (param.selected === undefined) param.selected = true;
		Util.populateSelect(selector, capacities, {
			valKey: 'id',
			nameKey: 'name',
			selected: param.selected, // for data page, don't select
		});
		$(selector).multiselect({
			maxHeight: 260,
			includeSelectAllOption: true,
			numberDisplayed: 0,
			dropUp: param.dropUp || false,
			dropLeft: param.dropLeft || false,
			dropRight: param.dropRight || false,
			...param.multiselectParam,
		});
	};

	/**
	 * Populates other dropdown multiselects.
	 * @param  {string} selector   Selector to target
	 * @param  {Object} [param={}] parameters
	 */
	App.populateOtherDropdown = (selector, items, valKey, nameKey, param = {}) => {
		// const emptyObj = { id: '', name: 'None - No core capacity tagged' };
		// const capacities = App.capacities.concat(emptyObj);
		if (param.selected === undefined) param.selected = true;
		Util.populateSelect(selector, items, {
			valKey: valKey,
			nameKey: nameKey,
			selected: param.selected, // for data page, don't select
		});
		$(selector).multiselect({
			maxHeight: 260,
			includeSelectAllOption: true,
			numberDisplayed: 0,
			dropUp: param.dropUp || false,
			dropLeft: param.dropLeft || false,
			dropRight: param.dropRight || false,
			...param.multiselectParam,
		});
	};

	// tests whether a payment satisfies a category filter
	App.passesCategoryFilter = (values, filterValues) => {
		if (filterValues.length === 0) return true;
		if (!values.length && filterValues.includes('')) return true;
		for (let i = 0; i < values.length; i++) {
			if (filterValues.includes(values[i])) return true;
		}
		return false;
	};
})();
