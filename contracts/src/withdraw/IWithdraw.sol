pragma solidity ^0.5.0;

contract IWithdraw {
	function withdraw(address _property) external;

	function getRewardsAmount(address _property)
		external
		view
		returns (uint256);

	function beforeBalanceChange(
		address _property,
		address _from,
		address _to
		// solium-disable-next-line indentation
	) external;

	function calculateAmount(address _property, address _user)
		external
		view
		returns (uint256);

	function calculateWithdrawableAmount(address _property, address _user)
		external
		view
		returns (uint256);
}
