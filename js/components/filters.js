(() => {

	/**
	 * Prepare parameters to intialize Bootstrap Multiselect
	 * @param  {Object} [extraParams={}] Extra parameters beyond defaults (op.)
	 * @return {Object}                  Parameters
	 */
	const prepMultiselectParams = (param = {}) => {
		const selectParams = {
			maxHeight: 260,
			includeSelectAllOption: true,
			numberDisplayed: 0,
			dropUp: param.dropUp || false,
			dropLeft: param.dropLeft || false,
			dropRight: param.dropRight || false,
		};
		for (paramName in param.multiselectParam) {
			selectParams[paramName] = param.multiselectParam[paramName];
		}
		return selectParams;
	};

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
		const selectParams = prepMultiselectParams(param);
		$(selector).multiselect(selectParams);
		const selectorBox = $(selector).siblings('.btn-group').children('button.multiselect');
		selectorBox.click(); // TODO remove this if/when doubleclick bug fixed
		document.activeElement.blur()
	};

	/**
	* Populates other dropdown multiselects.
	* @param  {string} selector   Selector to target
	* @param  {Object} [param={}] parameters
	*/
	App.populateOtherDropdown = (selector, items, valKey, nameKey, param = {}) => {
		if (param.selected === undefined) param.selected = true;
		Util.populateSelect(selector, items, {
			valKey: valKey,
			nameKey: nameKey,
			selected: param.selected, // for data page, don't select
		});
		const selectParams = prepMultiselectParams(param);
		$(selector).multiselect(selectParams);
		const selectorBox = $(selector).siblings('.btn-group').children('button.multiselect');
		selectorBox.click(); // TODO remove this if/when doubleclick bug fixed
		document.activeElement.blur()
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
