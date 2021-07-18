pragma solidity 0.5.17;

import {Ownable} from "@openzeppelin/contracts/ownership/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/lifecycle/Pausable.sol";
import {IPatchProvider} from "contracts/interface/IPatchProvider.sol";
import {IPatch} from "contracts/interface/IPatch.sol";
// prettier-ignore
import {AdminAndOperatorRole} from "contracts/dao/upgrader/AdminAndOperatorRole.sol";

contract PatchProvider is AdminAndOperatorRole, IPatchProvider {
	address public patch;
	address public patchSetter;

	function setPatch(address _patch) external onlyAdminAndOperator {
		patch = _patch;
		require(
			IPatch(_patch).upgrader() == address(this),
			"upgrader is different"
		);
		patchSetter = msg.sender;
	}

	function isPatchAddress(address _patch) public view returns (bool) {
		return patch == _patch;
	}
}
