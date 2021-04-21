pragma solidity 0.5.17;

import {Ownable} from "@openzeppelin/contracts/ownership/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/lifecycle/Pausable.sol";
import {IUpgrader} from "contracts/interface/IUpgrader.sol";
import {IPatch} from "contracts/interface/IPatch.sol";
import {DevProtocolAccess} from "contracts/dao/upgrader/DevProtocolAccess.sol";

contract Upgrader is DevProtocolAccess, IUpgrader {
	event Upgrade(string _name, address _current, address _next);

	function execute() external onlyAdminAndOperator {
		require(patchSetter != msg.sender, "not another operator");
		Pausable patchPause = Pausable(patch);
		require(patchPause.paused() == false, "already executed");
		Ownable(addressConfig).transferOwnership(patch);
		IPatch patchContract = IPatch(patch);
		patchContract.setConfigAddress(addressConfig);
		patchContract.run();
		patchContract.afterRun();
		patchPause.pause();
	}

	function addUpgradeEvent(
		string calldata _name,
		address _current,
		address _next
	) external {
		require(msg.sender == patch, "illegal access");
		emit Upgrade(_name, _current, _next);
	}
}