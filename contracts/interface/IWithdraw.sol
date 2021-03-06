// SPDX-License-Identifier: MPL-2.0
pragma solidity >=0.5.17;

interface IWithdraw {
	function withdraw(address _property) external;

	function getRewardsAmount(address _property)
		external
		view
		returns (uint256);

	function beforeBalanceChange(
		address _property,
		address _from,
		address _to
	) external;

	/**
	 * caution!!!this function is deprecated!!!
	 * use calculateRewardAmount
	 */
	function calculateWithdrawableAmount(address _property, address _user)
		external
		view
		returns (uint256);

	function calculateRewardAmount(address _property, address _user)
		external
		view
		returns (
			uint256 _amount,
			uint256 _price,
			uint256 _cap,
			uint256 _allReward
		);

	function devMinter() external view returns (address);
}
