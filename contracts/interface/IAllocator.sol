// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.5.17;

interface IAllocator {
	function beforeBalanceChange(
		address _property,
		address _from,
		address _to
	) external;

	function calculateMaxRewardsPerBlock() external view returns (uint256);
}
