pragma solidity 0.5.17;

import {
	AdminAndOperatorRole
} from "contracts/dao/upgrader/AdminAndOperatorRole.sol";

contract AdminAndOperatorRoleTest is AdminAndOperatorRole {
	function hasOperatingPrivilegesTest(address _sender)
		external
		view
		returns (bool)
	{
		return hasOperatingPrivileges(_sender);
	}

	function onlyAdminAndOperatorTest()
		external
		view
		onlyAdminAndOperator
		returns (bool)
	{
		return true;
	}
}
