pragma solidity 0.5.17;

import {Withdraw} from "contracts/src/withdraw/Withdraw.sol";

contract WithdrawTest is Withdraw {
	constructor(address _config) public Withdraw(_config) {}

	function setCumulativePriceTest(address _property, uint256 _value)
		external
	{
		setCumulativePrice(_property, _value);
	}

	function setLastWithdrawalPriceTest(
		address _property,
		address _user,
		uint256 _value
	) external {
		setLastWithdrawalPrice(_property, _user, _value);
	}
}
