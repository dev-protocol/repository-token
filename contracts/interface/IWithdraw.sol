// SPDX-License-Identifier: MPL-2.0
pragma solidity >=0.5.17;

interface IWithdraw {
	function withdraw(address _property) external;

	function bulkWithdraw(address[] calldata _properties)
		external
		returns (uint256);

	function getRewardsAmount(address _property)
		external
		view
		returns (uint256);

	function beforeBalanceChange(
		address _property,
		address _from,
		address _to
	) external;

	function calculateWithdrawableAmount(address _property, address _user)
		external
		view
		returns (uint256);
}
