pragma solidity 0.5.17;

import {Roles} from "@openzeppelin/contracts/access/Roles.sol";
import {Counters} from "@openzeppelin/contracts/drafts/Counters.sol";
// prettier-ignore
import {IAdminAndOperatorRole} from "contracts/interface/IAdminAndOperatorRole.sol";

contract AdminAndOperatorRole is IAdminAndOperatorRole {
	using Roles for Roles.Role;
	using Counters for Counters.Counter;

	Roles.Role private _admins;
	Roles.Role private _operators;
	Counters.Counter private _adminCounter;

	constructor() public {
		_admins.add(msg.sender);
		_adminCounter.increment();
	}

	modifier onlyAdmin() {
		require(_admins.has(msg.sender), "does not have admin role");
		_;
	}

	modifier onlyAdminAndOperator() {
		require(
			hasOperatingPrivileges(msg.sender),
			"does not have operator role"
		);
		_;
	}

	function hasOperatingPrivileges(address _sender)
		internal
		view
		returns (bool)
	{
		bool hasAdminRole = _admins.has(_sender);
		if (hasAdminRole) {
			return true;
		}
		return _operators.has(_sender);
	}

	function addAdmin(address _account) external onlyAdmin {
		_admins.add(_account);
		_adminCounter.increment();
	}

	function removeAdmin(address _account) external onlyAdmin {
		_admins.remove(_account);
		_adminCounter.decrement();
		require(
			_adminCounter.current() >= 1,
			"last administrator can not be removed"
		);
	}

	function hasAdmin(address _account) external view returns (bool) {
		return _admins.has(_account);
	}

	function addOperator(address _account) external onlyAdmin {
		_operators.add(_account);
	}

	function removeOperator(address _account) external onlyAdmin {
		_operators.remove(_account);
	}

	function hasOperator(address _account) external view returns (bool) {
		return _operators.has(_account);
	}
}
